import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CsvTaskRow = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  start_date?: string;
  due_date?: string;
  status?: string;
};

type NormalizedCsvTaskRow = Required<CsvTaskRow>;

const REQUIRED_CSV_HEADERS = [
  "id",
  "title",
  "description",
  "category",
  "priority",
  "start_date",
  "due_date",
  "status",
] as const;

const CSV_SAMPLE = [
  "id,title,description,category,priority,start_date,due_date,status",
  "task-001,Buy groceries,Get groceries for the week,Personal,MEDIUM,2026-10-03,2026-10-03,PENDING",
  "task-002,Complete project,Finish the assessment,Work,HIGH,2026-10-04,2026-10-05,PENDING",
  "task-003,Read a book,Read for 30 minutes,Study,LOW,2026-10-06,2026-10-06,COMPLETED",
].join("\n");

function normalizeRow(row: Record<string, unknown>): CsvTaskRow {
  const normalized = Object.entries(row).reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      result[key.trim().toLowerCase()] = value;
      return result;
    },
    {},
  );

  return {
    id: typeof normalized.id === "string" ? normalized.id : "",
    title: typeof normalized.title === "string" ? normalized.title : "",
    description:
      typeof normalized.description === "string"
        ? normalized.description
        : "",
    category:
      typeof normalized.category === "string" ? normalized.category : "",
    priority:
      typeof normalized.priority === "string" ? normalized.priority : "",
    start_date:
      typeof normalized.start_date === "string"
        ? normalized.start_date
        : "",
    due_date: typeof normalized.due_date === "string" ? normalized.due_date : "",
    status: typeof normalized.status === "string" ? normalized.status : "",
  };
}

function validateCsvHeaders(fields: string[] | undefined): string[] {
  if (!fields || fields.length === 0) {
    return ["CSV must contain a header row"];
  }

  const headers = fields.map((field) => field.trim().toLowerCase());
  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  return missingHeaders.length > 0
    ? ["Missing required column(s): " + missingHeaders.join(", ")]
    : [];
}

function isValidDate(value: string): boolean {
  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return false;
  }

  const date = new Date(trimmedValue + "T00:00:00Z");

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === trimmedValue
  );
}

function validateCsvRow(row: CsvTaskRow, rowNumber: number): string[] {
  const errors: string[] = [];
  const priority = row.priority?.trim().toUpperCase();
  const status = row.status?.trim().toUpperCase();

  if (!row.id?.trim()) errors.push("Row " + rowNumber + ": ID is required");
  if (!row.title?.trim()) errors.push("Row " + rowNumber + ": Title is required");
  if (!row.category?.trim()) {
    errors.push("Row " + rowNumber + ": Category is required");
  }

  if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) {
    errors.push(
      "Row " +
        rowNumber +
        ": Priority must be LOW, MEDIUM, or HIGH",
    );
  }

  if (!row.start_date?.trim()) {
    errors.push("Row " + rowNumber + ": Start date is required");
  } else if (!isValidDate(row.start_date)) {
    errors.push(
      "Row " +
        rowNumber +
        ": Start date must use YYYY-MM-DD and be a valid date",
    );
  }

  if (!row.due_date?.trim()) {
    errors.push("Row " + rowNumber + ": Due date is required");
  } else if (!isValidDate(row.due_date)) {
    errors.push(
      "Row " +
        rowNumber +
        ": Due date must use YYYY-MM-DD and be a valid date",
    );
  }

  if (
    row.start_date &&
    row.due_date &&
    isValidDate(row.start_date) &&
    isValidDate(row.due_date) &&
    new Date(row.due_date.trim() + "T00:00:00Z") <
      new Date(row.start_date.trim() + "T00:00:00Z")
  ) {
    errors.push(
      "Row " + rowNumber + ": Due date cannot be earlier than start date",
    );
  }

  if (status && !["PENDING", "COMPLETED"].includes(status)) {
    errors.push(
      "Row " + rowNumber + ": Status must be PENDING or COMPLETED",
    );
  }

  return errors;
}

export default function BulkUploadScreen() {
  const { addTask, findTask } = useTasks();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, isDark, insets.top);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [validRows, setValidRows] = useState<NormalizedCsvTaskRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    duplicates: number;
    failed: number;
  } | null>(null);

  const fileSizeLabel = useMemo(() => {
    if (fileSize === null) return null;
    if (fileSize < 1024) return fileSize + " B";
    return Math.max(1, Math.round(fileSize / 1024)) + " KB";
  }, [fileSize]);

  async function handlePickFile() {
    try {
      setLoading(true);
      setFileName(null);
      setFileSize(null);
      setValidRows([]);
      setValidationErrors([]);
      setCsvError(null);
      setImportSummary(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset.name.toLowerCase().endsWith(".csv")) {
        setCsvError("Please select a .csv file.");
        return;
      }

      const response = await fetch(asset.uri);
      const content = await response.text();

      const results = Papa.parse<Record<string, unknown>>(content, {
        header: true,
        skipEmptyLines: true,
      });

      if (results.errors.length > 0) {
        setCsvError("The CSV file could not be parsed correctly.");
        return;
      }

      const headerErrors = validateCsvHeaders(results.meta.fields);

      if (headerErrors.length > 0) {
        setValidationErrors(headerErrors);
        setFileName(asset.name);
        setFileSize(asset.size ?? null);
        return;
      }

      if (results.data.length === 0) {
        setCsvError("The CSV file does not contain any task rows.");
        return;
      }

      const valid: NormalizedCsvTaskRow[] = [];
      const errors: string[] = [];
      const seenIds = new Set<string>();

      results.data.forEach((rawRow, index) => {
        const rowNumber = index + 2;
        const row = normalizeRow(rawRow);
        const rowErrors = validateCsvRow(row, rowNumber);

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          return;
        }

        const id = row.id!.trim();

        if (seenIds.has(id)) {
          errors.push(
            "Row " + rowNumber + ": Duplicate ID " + id + " in this CSV file",
          );
          return;
        }

        seenIds.add(id);

        valid.push({
          id,
          title: row.title!.trim(),
          description: row.description?.trim() ?? "",
          category: row.category!.trim(),
          priority: row.priority?.trim().toUpperCase() || "MEDIUM",
          start_date: row.start_date!.trim(),
          due_date: row.due_date!.trim(),
          status: row.status?.trim().toUpperCase() || "PENDING",
        });
      });

      setFileName(asset.name);
      setFileSize(asset.size ?? null);
      setValidRows(valid);
      setValidationErrors(errors);
    } catch (error) {
      console.error("Failed to read CSV:", error);
      setCsvError("Unable to read the selected CSV file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;

    try {
      setLoading(true);
      setImportSummary(null);

      let importedCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      for (const row of validRows) {
        try {
          const existingTask = await findTask(row.id);

          if (existingTask) {
            duplicateCount++;
            continue;
          }

          const now = new Date().toISOString();

          await addTask({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            priority: row.priority as "LOW" | "MEDIUM" | "HIGH",
            startDate: row.start_date,
            dueDate: row.due_date,
            status: row.status as "PENDING" | "COMPLETED",
            createdAt: now,
            updatedAt: now,
          });

          importedCount++;
        } catch (error) {
          console.error("Failed to import row " + row.id + ":", error);
          failedCount++;
        }
      }

      setImportSummary({
        imported: importedCount,
        duplicates: duplicateCount,
        failed: failedCount,
      });

      Alert.alert(
        "Import complete",
        [
          importedCount + " task(s) imported.",
          duplicateCount > 0
            ? duplicateCount + " duplicate task(s) skipped."
            : null,
          failedCount > 0 ? failedCount + " task(s) failed." : null,
          validationErrors.length > 0
            ? validationErrors.length +
              " validation issue(s) skipped."
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } catch (error) {
      console.error("Failed to import tasks:", error);
      Alert.alert("Import failed", "Unable to import the selected tasks.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      const permission =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permission.granted) {
        return;
      }

      const fileName =
        "taskflow-csv-template-" +
        new Date().toISOString().slice(0, 10) +
        ".csv";

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        "text/csv",
      );

      await FileSystem.writeAsStringAsync(fileUri, CSV_SAMPLE);

      Alert.alert("Template saved", "The CSV template was saved successfully.");
    } catch (error) {
      console.error("Failed to save CSV template:", error);
      Alert.alert("Template failed", "Unable to save the CSV template.");
    }
  }

  function clearSelectedFile() {
    setFileName(null);
    setFileSize(null);
    setValidRows([]);
    setValidationErrors([]);
    setCsvError(null);
    setImportSummary(null);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.navigate("/")}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon
            name={{
              ios: "chevron.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            size={22}
            color={colors.foreground}
          />
        </Pressable>

        <Text style={styles.topBarTitle}>Bulk Import</Text>

        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <AppIcon
            name={{
              ios: "arrow.down.doc.fill",
              android: "upload_file",
              web: "upload_file",
            }}
            size={25}
            color={colors.accent}
          />
        </View>
        <Text style={styles.title}>Import your tasks</Text>
        <Text style={styles.subtitle}>
          Add multiple tasks at once using a CSV file and save time.
        </Text>
      </View>

      <View style={styles.uploadCard}>
        <View style={styles.uploadIcon}>
          <AppIcon
            name={{
              ios: "doc.badge.plus",
              android: "note_add",
              web: "note_add",
            }}
            size={30}
            color={colors.accent}
          />
        </View>

        <Text style={styles.cardTitle}>Choose a CSV file</Text>
        <Text style={styles.cardDescription}>
          Select a CSV file from your device.
        </Text>

        <Pressable
          onPress={handlePickFile}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select CSV file"
        >
          <AppIcon
            name={{ ios: "folder", android: "folder_open", web: "folder_open" }}
            size={19}
            color={colors.primaryForeground}
          />
          <Text style={styles.primaryButtonText}>
            {loading ? "Reading file..." : "Select CSV File"}
          </Text>
        </Pressable>

        {fileName ? (
          <View style={styles.fileInfo}>
            <View style={styles.fileIcon}>
              <AppIcon
                name={{
                  ios: "doc.text.fill",
                  android: "description",
                  web: "description",
                }}
                size={20}
                color={colors.accent}
              />
            </View>

            <View style={styles.fileContent}>
              <Text style={styles.fileName} numberOfLines={1}>
                {fileName}
              </Text>
              {fileSizeLabel ? (
                <Text style={styles.fileMeta}>{fileSizeLabel}</Text>
              ) : null}
            </View>

            <Pressable
              onPress={clearSelectedFile}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Remove selected file"
            >
              <AppIcon
                name={{ ios: "xmark", android: "close", web: "close" }}
                size={19}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={handleDownloadTemplate}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Download CSV template"
      >
        <AppIcon
          name={{
            ios: "arrow.down.to.line",
            android: "download",
            web: "download",
          }}
          size={19}
          color={colors.accent}
        />
        <Text style={styles.secondaryButtonText}>Download CSV Template</Text>
      </Pressable>

      <View style={styles.notesCard}>
        <View style={styles.notesIcon}>
          <AppIcon
            name={{ ios: "info.circle.fill", android: "info", web: "info" }}
            size={19}
            color={colors.accent}
          />
        </View>

        <View style={styles.notesContent}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.noteText}>
            • The first row should contain column headers.
          </Text>
          <Text style={styles.noteText}>• Dates should use YYYY-MM-DD.</Text>
          <Text style={styles.noteText}>
            • Invalid rows are skipped with a warning.
          </Text>
        </View>
      </View>

      {fileName ? (
        <View style={styles.validationCard}>
          <View style={styles.validationHeader}>
            <View style={styles.statusIcon}>
              <AppIcon
                name={{
                  ios:
                    validationErrors.length > 0
                      ? "exclamationmark.triangle.fill"
                      : "checkmark.circle.fill",
                  android:
                    validationErrors.length > 0 ? "warning" : "check_circle",
                  web:
                    validationErrors.length > 0 ? "warning" : "check_circle",
                }}
                size={20}
                color={
                  validationErrors.length > 0
                    ? colors.destructive
                    : colors.success
                }
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.cardTitle}>
                {validationErrors.length > 0
                  ? "File checked"
                  : "Ready to import"}
              </Text>
              <Text style={styles.validationText}>
                {validRows.length} valid row
                {validRows.length === 1 ? "" : "s"}
                {validationErrors.length > 0
                  ? " • " +
                    validationErrors.length +
                    " issue" +
                    (validationErrors.length === 1 ? "" : "s")
                  : ""}
              </Text>
            </View>
          </View>

          {validationErrors.length > 0 ? (
            <View style={styles.errorList}>
              {validationErrors.slice(0, 8).map((error, index) => (
                <Text key={error + "-" + index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}

              {validationErrors.length > 8 ? (
                <Text style={styles.moreErrors}>
                  + {validationErrors.length - 8} more issue
                  {validationErrors.length - 8 === 1 ? "" : "s"}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      {csvError ? (
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <AppIcon
              name={{
                ios: "exclamationmark.triangle.fill",
                android: "warning",
                web: "warning",
              }}
              size={20}
              color={colors.destructive}
            />
            <Text style={styles.errorTitle}>CSV Error</Text>
          </View>
          <Text style={styles.errorText}>{csvError}</Text>
        </View>
      ) : null}

      {importSummary ? (
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <AppIcon
              name={{
                ios: "checkmark.circle.fill",
                android: "check_circle",
                web: "check_circle",
              }}
              size={21}
              color={colors.success}
            />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.cardTitle}>Import complete</Text>
            <Text style={styles.validationText}>
              {importSummary.imported} imported
              {importSummary.duplicates > 0
                ? " • " +
                  importSummary.duplicates +
                  " duplicate" +
                  (importSummary.duplicates === 1 ? "" : "s") +
                  " skipped"
                : ""}
              {importSummary.failed > 0
                ? " • " + importSummary.failed + " failed"
                : ""}
            </Text>
          </View>
        </View>
      ) : null}

      {fileName && validRows.length > 0 && !importSummary ? (
        <Pressable
          onPress={handleImport}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.importButton,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={"Import " + validRows.length + " tasks"}
        >
          <AppIcon
            name={{
              ios: "arrow.down.doc.fill",
              android: "file_upload",
              web: "file_upload",
            }}
            size={19}
            color={colors.primaryForeground}
          />
          <Text style={styles.primaryButtonText}>
            {loading ? "Importing..." : "Import " + validRows.length + " Tasks"}
          </Text>
        </Pressable>
      ) : null}

      {importSummary ? (
        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.importButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <AppIcon
            name={{
              ios: "house.fill",
              android: "home",
              web: "home",
            }}
            size={19}
            color={colors.primaryForeground}
          />
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function createStyles(
  colors: ThemeColors,
  isDark: boolean,
  topInset: number,
) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: topInset + spacing.sm,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    topBar: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    topBarTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },
    topBarSpacer: {
      width: 40,
    },
    hero: {
      alignItems: "center",
      gap: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    heroIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent + "18",
    },
    title: {
      fontSize: typography.xl,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    subtitle: {
      maxWidth: 320,
      fontSize: typography.sm,
      lineHeight: 20,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    uploadCard: {
      borderWidth: 1,
      borderColor: colors.accent + "55",
      borderRadius: 18,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.card,
    },
    uploadIcon: {
      width: 58,
      height: 58,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent + "18",
    },
    cardTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },
    cardDescription: {
      maxWidth: 300,
      fontSize: typography.sm,
      lineHeight: 20,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    primaryButton: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.accent,
    },
    primaryButtonText: {
      fontSize: typography.sm,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    secondaryButton: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.accent + "35",
      borderRadius: 12,
      paddingHorizontal: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.accent + "10",
    },
    secondaryButtonText: {
      fontSize: typography.sm,
      fontWeight: "700",
      color: colors.accent,
    },
    fileInfo: {
      width: "100%",
      marginTop: spacing.xs,
      padding: spacing.sm,
      borderRadius: 12,
      backgroundColor: colors.muted,
      flexDirection: "row",
      alignItems: "center",
    },
    fileIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      marginRight: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    fileContent: {
      flex: 1,
      marginRight: spacing.sm,
    },
    fileName: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.foreground,
    },
    fileMeta: {
      marginTop: 2,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    notesCard: {
      borderWidth: 1,
      borderColor: colors.accent + "25",
      borderRadius: 16,
      padding: spacing.md,
      flexDirection: "row",
      backgroundColor: colors.accent + "0C",
    },
    notesIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent + "18",
      marginRight: spacing.sm,
    },
    notesContent: {
      flex: 1,
      gap: 4,
    },
    notesTitle: {
      fontSize: typography.sm,
      fontWeight: "700",
      color: colors.accent,
    },
    noteText: {
      fontSize: typography.xs,
      lineHeight: 18,
      color: colors.mutedForeground,
    },
    validationCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.md,
      backgroundColor: colors.card,
    },
    validationHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      marginRight: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    rowContent: {
      flex: 1,
    },
    validationText: {
      marginTop: 2,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    errorList: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 4,
    },
    errorText: {
      fontSize: typography.xs,
      lineHeight: 18,
      color: colors.destructive,
    },
    moreErrors: {
      marginTop: 2,
      fontSize: typography.xs,
      fontWeight: "600",
      color: colors.mutedForeground,
    },
    errorCard: {
      borderWidth: 1,
      borderColor: colors.destructive + "55",
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.destructive + "08",
    },
    errorHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    errorTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.destructive,
    },
    successCard: {
      borderWidth: 1,
      borderColor: colors.success + "40",
      borderRadius: 16,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.success + "08",
    },
    successIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      marginRight: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success + "15",
    },
    importButton: {
      width: "100%",
      marginTop: spacing.xs,
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
