import { AppButton } from "@/components/ui/AppButton";
import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import Papa from "papaparse";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

function validateCsvHeaders(fields: string[] | undefined): string[] {
  if (!fields || fields.length === 0) {
    return ["CSV must contain a header row"];
  }

  const headers = fields.map((field) => field.trim().toLowerCase());
  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    return [
      `Missing required column(s): ${missingHeaders.join(", ")}`,
    ];
  }

  return [];
}

function isValidDate(value: string): boolean {
  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return false;
  }

  const date = new Date(`${trimmedValue}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === trimmedValue
  );
}

function validateCsvRow(row: CsvTaskRow, rowNumber: number): string[] {
  const errors: string[] = [];
  const priority = row.priority?.trim().toUpperCase();
  const status = row.status?.trim().toUpperCase();

  if (!row.id?.trim()) {
    errors.push(`Row ${rowNumber}: ID is required`);
  }

  if (!row.title?.trim()) {
    errors.push(`Row ${rowNumber}: Title is required`);
  }

  if (!row.category?.trim()) {
    errors.push(`Row ${rowNumber}: Category is required`);
  }

  if (
    priority &&
    !["LOW", "MEDIUM", "HIGH"].includes(priority)
  ) {
    errors.push(`Row ${rowNumber}: Priority must be LOW, MEDIUM, or HIGH`);
  }

  if (!row.start_date?.trim()) {
    errors.push(`Row ${rowNumber}: Start date is required`);
  } else if (!isValidDate(row.start_date)) {
    errors.push(
      `Row ${rowNumber}: Start date must use YYYY-MM-DD and be a valid date`,
    );
  }

  if (!row.due_date?.trim()) {
    errors.push(`Row ${rowNumber}: Due date is required`);
  } else if (!isValidDate(row.due_date)) {
    errors.push(
      `Row ${rowNumber}: Due date must use YYYY-MM-DD and be a valid date`,
    );
  }

  if (
    row.start_date &&
    row.due_date &&
    isValidDate(row.start_date) &&
    isValidDate(row.due_date) &&
    new Date(`${row.due_date.trim()}T00:00:00Z`) <
      new Date(`${row.start_date.trim()}T00:00:00Z`)
  ) {
    errors.push(`Row ${rowNumber}: Due date cannot be earlier than start date`);
  }

  if (
    status &&
    !["PENDING", "COMPLETED"].includes(status)
  ) {
    errors.push(`Row ${rowNumber}: Status must be PENDING or COMPLETED`);
  }

  return errors;
}

export default function BulkUploadScreen() {
  const { addTask, findTask } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  async function handlePickFile() {
    try {
      setLoading(true);
      setValidationErrors([]);
      setCsvError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset.name.toLowerCase().endsWith(".csv")) {
        Alert.alert("Invalid file", "Please select a .csv file.");
        return;
      }

      const response = await fetch(asset.uri);
      const content = await response.text();

      setFileName(asset.name);
      setFileContent(content);

      const results = Papa.parse<CsvTaskRow>(content, {
        header: true,
        skipEmptyLines: true,
      });

      console.log("CSV ROWS:", results.data);
      console.log("CSV ERRORS:", results.errors);

      if (results.errors.length > 0) {
        console.log("CSV PARSE ERRORS:", results.errors);

        const message = "The CSV file could not be parsed correctly.";
        setCsvError(message);
        Alert.alert("CSV Error", message);

        return;
      }

      const headerErrors = validateCsvHeaders(results.meta.fields);

      if (headerErrors.length > 0) {
        console.log("HEADER ERRORS:", headerErrors);

        setValidationErrors(headerErrors);
        Alert.alert("Invalid CSV headers", headerErrors.join("\n"));

        return;
      }

      if (results.data.length === 0) {
        const message = "The CSV file does not contain any task rows.";
        setCsvError(message);
        Alert.alert("Empty CSV", message);

        return;
      }

      const validationErrors: string[] = [];

      results.data.forEach((row, index) => {
        const rowErrors = validateCsvRow(row, index + 2);

        validationErrors.push(...rowErrors);
      });

      if (validationErrors.length > 0) {
        console.log("VALIDATION ERRORS:", validationErrors);

        setValidationErrors(validationErrors);
        Alert.alert("Validation failed", validationErrors.join("\n"));

        return;
      }

      console.log("CSV VALIDATION PASSED");

      let importedCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      for (const row of results.data) {
        try {
          const id = row.id!.trim();

          const existingTask = await findTask(id);

          if (existingTask) {
            console.log(`Duplicate task skipped: ${id}`);
            duplicateCount++;
            continue;
          }

          await addTask({
            id,
            title: row.title!.trim(),
            description: row.description?.trim() ?? "",
            category: row.category!.trim(),
            priority: (row.priority?.trim().toUpperCase() || "MEDIUM") as
              | "LOW"
              | "MEDIUM"
              | "HIGH",
            startDate: row.start_date!.trim(),
            dueDate: row.due_date!.trim(),
            status: (row.status?.trim().toUpperCase() || "PENDING") as
              | "PENDING"
              | "COMPLETED",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          importedCount++;
        } catch (error) {
          console.error(`Failed to import row ${row.id}:`, error);

          failedCount++;
        }
      }

      console.log("IMPORTED:", importedCount);
      console.log("FAILED:", failedCount);

      Alert.alert(
        "Import complete",
        [
          `${importedCount} task(s) imported.`,
          duplicateCount > 0
            ? `${duplicateCount} duplicate task(s) skipped.`
            : null,
          failedCount > 0 ? `${failedCount} task(s) failed.` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } catch (error) {
      console.error("Failed to read CSV:", error);
      Alert.alert("Import failed", "Unable to read the selected CSV file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            size={22}
            color={colors.foreground}
          />
        </Pressable>

        <Text style={styles.topBarTitle}>Bulk Import</Text>

        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <AppIcon
            name={{ ios: "arrow.down.doc.fill", android: "upload_file", web: "upload_file" }}
            size={24}
            color={colors.accent}
          />
        </View>
        <Text style={styles.title}>Import your tasks</Text>
        <Text style={styles.subtitle}>
          Add multiple tasks at once using a CSV file.
        </Text>
      </View>

      <View style={styles.uploadCard}>
        <View style={styles.uploadIcon}>
          <AppIcon
            name={{ ios: "doc.badge.plus", android: "note_add", web: "note_add" }}
            size={28}
            color={colors.accent}
          />
        </View>

        <Text style={styles.cardTitle}>Choose a CSV file</Text>
        <Text style={styles.cardDescription}>
          Your file should include task details such as title, category,
          priority, start date, due date, and status.
        </Text>

        <AppButton
          title={loading ? "Reading file..." : "Select CSV File"}
          onPress={handlePickFile}
          loading={loading}
          disabled={loading}
        />

        {fileName ? (
          <View style={styles.fileInfo}>
            <View style={styles.fileIcon}>
              <AppIcon
                name={{ ios: "doc.text.fill", android: "description", web: "description" }}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.fileContent}>
              <Text style={styles.fileLabel}>Selected file</Text>
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
            </View>
            <AppIcon
              name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
              size={20}
              color={colors.success}
            />
          </View>
        ) : null}
      </View>

      {fileContent ? (
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <AppIcon
                name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                size={20}
                color={colors.success}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.cardTitle}>File loaded</Text>
              <Text style={styles.rowCount}>
                {fileContent.split(/\r?\n/).filter(Boolean).length - 1} data rows detected
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {csvError ? (
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <AppIcon
              name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
              size={20}
              color={colors.destructive}
            />
            <Text style={styles.errorTitle}>CSV Error</Text>
          </View>
          <Text style={styles.errorText}>{csvError}</Text>
        </View>
      ) : null}

      {validationErrors.length > 0 ? (
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <AppIcon
              name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
              size={20}
              color={colors.destructive}
            />
            <Text style={styles.errorTitle}>Validation Errors</Text>
          </View>

          {validationErrors.map((error, index) => (
            <Text key={`${error}-${index}`} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backAction, pressed && styles.pressed]}
      >
        <AppIcon
          name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
          size={18}
          color={colors.foreground}
        />
        <Text style={styles.backActionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, topInset: number) {
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
      borderRadius: 12,
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
    header: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
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
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.card,
    },
    uploadIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent + "18",
    },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.lg,
      backgroundColor: colors.card,
    },
    cardTitle: {
      fontSize: typography.md,
      fontWeight: "700",
      color: colors.foreground,
    },
    cardDescription: {
      fontSize: typography.sm,
      lineHeight: 20,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    fileInfo: {
      width: "100%",
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
      gap: 2,
    },
    fileLabel: {
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    fileName: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.foreground,
    },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    resultIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      marginRight: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success + "18",
    },
    rowContent: {
      flex: 1,
    },
    rowCount: {
      marginTop: 2,
      fontSize: typography.xs,
      color: colors.mutedForeground,
    },
    errorCard: {
      borderWidth: 1,
      borderColor: colors.destructive + "55",
      borderRadius: 16,
      padding: spacing.lg,
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
    errorText: {
      fontSize: typography.sm,
      lineHeight: 20,
      color: colors.foreground,
    },
    backAction: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    backActionText: {
      fontSize: typography.sm,
      fontWeight: "600",
      color: colors.foreground,
    },
    pressed: {
      opacity: 0.72,
    },
  });rt { AppButton } from "@/components/ui/AppButton";
import { AppIcon } from "@/components/ui/AppIcon";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import Papa from "papaparse";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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

function validateCsvHeaders(fields: string[] | undefined): string[] {
  if (!fields || fields.length === 0) {
    return ["CSV must contain a header row"];
  }

  const headers = fields.map((field) => field.trim().toLowerCase());
  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    return [
      `Missing required column(s): ${missingHeaders.join(", ")}`,
    ];
  }

  return [];
}

function isValidDate(value: string): boolean {
  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return false;
  }

  const date = new Date(`${trimmedValue}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === trimmedValue
  );
}

function validateCsvRow(row: CsvTaskRow, rowNumber: number): string[] {
  const errors: string[] = [];
  const priority = row.priority?.trim().toUpperCase();
  const status = row.status?.trim().toUpperCase();

  if (!row.id?.trim()) {
    errors.push(`Row ${rowNumber}: ID is required`);
  }

  if (!row.title?.trim()) {
    errors.push(`Row ${rowNumber}: Title is required`);
  }

  if (!row.category?.trim()) {
    errors.push(`Row ${rowNumber}: Category is required`);
  }

  if (
    priority &&
    !["LOW", "MEDIUM", "HIGH"].includes(priority)
  ) {
    errors.push(`Row ${rowNumber}: Priority must be LOW, MEDIUM, or HIGH`);
  }

  if (!row.start_date?.trim()) {
    errors.push(`Row ${rowNumber}: Start date is required`);
  } else if (!isValidDate(row.start_date)) {
    errors.push(
      `Row ${rowNumber}: Start date must use YYYY-MM-DD and be a valid date`,
    );
  }

  if (!row.due_date?.trim()) {
    errors.push(`Row ${rowNumber}: Due date is required`);
  } else if (!isValidDate(row.due_date)) {
    errors.push(
      `Row ${rowNumber}: Due date must use YYYY-MM-DD and be a valid date`,
    );
  }

  if (
    row.start_date &&
    row.due_date &&
    isValidDate(row.start_date) &&
    isValidDate(row.due_date) &&
    new Date(`${row.due_date.trim()}T00:00:00Z`) <
      new Date(`${row.start_date.trim()}T00:00:00Z`)
  ) {
    errors.push(`Row ${rowNumber}: Due date cannot be earlier than start date`);
  }

  if (
    status &&
    !["PENDING", "COMPLETED"].includes(status)
  ) {
    errors.push(`Row ${rowNumber}: Status must be PENDING or COMPLETED`);
  }

  return errors;
}

export default function BulkUploadScreen() {
  const { addTask, findTask } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  async function handlePickFile() {
    try {
      setLoading(true);
      setValidationErrors([]);
      setCsvError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (!asset.name.toLowerCase().endsWith(".csv")) {
        Alert.alert("Invalid file", "Please select a .csv file.");
        return;
      }

      const response = await fetch(asset.uri);
      const content = await response.text();

      setFileName(asset.name);
      setFileContent(content);

      const results = Papa.parse<CsvTaskRow>(content, {
        header: true,
        skipEmptyLines: true,
      });

      console.log("CSV ROWS:", results.data);
      console.log("CSV ERRORS:", results.errors);

      if (results.errors.length > 0) {
        console.log("CSV PARSE ERRORS:", results.errors);

        const message = "The CSV file could not be parsed correctly.";
        setCsvError(message);
        Alert.alert("CSV Error", message);

        return;
      }

      const headerErrors = validateCsvHeaders(results.meta.fields);

      if (headerErrors.length > 0) {
        console.log("HEADER ERRORS:", headerErrors);

        setValidationErrors(headerErrors);
        Alert.alert("Invalid CSV headers", headerErrors.join("\n"));

        return;
      }

      if (results.data.length === 0) {
        const message = "The CSV file does not contain any task rows.";
        setCsvError(message);
        Alert.alert("Empty CSV", message);

        return;
      }

      const validationErrors: string[] = [];

      results.data.forEach((row, index) => {
        const rowErrors = validateCsvRow(row, index + 2);

        validationErrors.push(...rowErrors);
      });

      if (validationErrors.length > 0) {
        console.log("VALIDATION ERRORS:", validationErrors);

        setValidationErrors(validationErrors);
        Alert.alert("Validation failed", validationErrors.join("\n"));

        return;
      }

      console.log("CSV VALIDATION PASSED");

      let importedCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      for (const row of results.data) {
        try {
          const id = row.id!.trim();

          const existingTask = await findTask(id);

          if (existingTask) {
            console.log(`Duplicate task skipped: ${id}`);
            duplicateCount++;
            continue;
          }

          await addTask({
            id,
            title: row.title!.trim(),
            description: row.description?.trim() ?? "",
            category: row.category!.trim(),
            priority: (row.priority?.trim().toUpperCase() || "MEDIUM") as
              | "LOW"
              | "MEDIUM"
              | "HIGH",
            startDate: row.start_date!.trim(),
            dueDate: row.due_date!.trim(),
            status: (row.status?.trim().toUpperCase() || "PENDING") as
              | "PENDING"
              | "COMPLETED",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          importedCount++;
        } catch (error) {
          console.error(`Failed to import row ${row.id}:`, error);

          failedCount++;
        }
      }

      console.log("IMPORTED:", importedCount);
      console.log("FAILED:", failedCount);

      Alert.alert(
        "Import complete",
        [
          `${importedCount} task(s) imported.`,
          duplicateCount > 0
            ? `${duplicateCount} duplicate task(s) skipped.`
            : null,
          failedCount > 0 ? `${failedCount} task(s) failed.` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } catch (error) {
      console.error("Failed to read CSV:", error);
      Alert.alert("Import failed", "Unable to read the selected CSV file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            size={22}
            color={colors.foreground}
          />
        </Pressable>

        <Text style={styles.topBarTitle}>Bulk Import</Text>

        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <AppIcon
            name={{ ios: "arrow.down.doc.fill", android: "upload_file", web: "upload_file" }}
            size={24}
            color={colors.accent}
          />
        </View>
        <Text style={styles.title}>Import your tasks</Text>
        <Text style={styles.subtitle}>
          Add multiple tasks at once using a CSV file.
        </Text>
      </View>

      <View style={styles.uploadCard}>
        <View style={styles.uploadIcon}>
          <AppIcon
            name={{ ios: "doc.badge.plus", android: "note_add", web: "note_add" }}
            size={28}
            color={colors.accent}
          />
        </View>

        <Text style={styles.cardTitle}>Choose a CSV file</Text>
        <Text style={styles.cardDescription}>
          Your file should include task details such as title, category,
          priority, start date, due date, and status.
        </Text>

        <AppButton
          title={loading ? "Reading file..." : "Select CSV File"}
          onPress={handlePickFile}
          loading={loading}
          disabled={loading}
        />

        {fileName ? (
          <View style={styles.fileInfo}>
            <View style={styles.fileIcon}>
              <AppIcon
                name={{ ios: "doc.text.fill", android: "description", web: "description" }}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.fileContent}>
              <Text style={styles.fileLabel}>Selected file</Text>
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
            </View>
            <AppIcon
              name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
              size={20}
              color={colors.success}
            />
          </View>
        ) : null}
      </View>

      {fileContent ? (
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIcon}>
              <AppIcon
                name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                size={20}
                color={colors.success}
              />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.cardTitle}>File loaded</Text>
              <Text style={styles.rowCount}>
                {fileContent.split(/\r?\n/).filter(Boolean).length - 1} data rows detected
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {csvError ? (
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <AppIcon
              name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
              size={20}
              color={colors.destructive}
            />
            <Text style={styles.errorTitle}>CSV Error</Text>
          </View>
          <Text style={styles.errorText}>{csvError}</Text>
        </View>
      ) : null}

      {validationErrors.length > 0 ? (
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <AppIcon
              name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
              size={20}
              color={colors.destructive}
            />
            <Text style={styles.errorTitle}>Validation Errors</Text>
          </View>

          {validationErrors.map((error, index) => (
            <Text key={`${error}-${index}`} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backAction, pressed && styles.pressed]}
      >
        <AppIcon
          name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
          size={18}
          color={colors.foreground}
        />
        <Text style={styles.backActionText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, topInset: number) {
  return StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.xl,
  },

  header: {
    gap: spacing.sm,
  },

  title: {
    fontSize: typography.xxxl,
    fontWeight: "700",
    color: colors.foreground,
  },

  subtitle: {
    fontSize: typography.md,
    color: colors.mutedForeground,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.xl,
    gap: spacing.lg,
  },

  cardTitle: {
    fontSize: typography.lg,
    fontWeight: "700",
    color: colors.foreground,
  },

  cardDescription: {
    fontSize: typography.md,
    color: colors.mutedForeground,
    lineHeight: 22,
  },

  fileInfo: {
    backgroundColor: colors.muted,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },

  fileLabel: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  fileName: {
    fontSize: typography.md,
    fontWeight: "600",
    color: colors.foreground,
  },

  successText: {
    fontSize: typography.md,
    color: colors.success,
    fontWeight: "600",
  },

  rowCount: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },

  errorCard: {
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 18,
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.card,
  },

  errorTitle: {
    fontSize: typography.lg,
    fontWeight: "700",
    color: colors.destructive,
  },

  errorText: {
    fontSize: typography.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
});
}
