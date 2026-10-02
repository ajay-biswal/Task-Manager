import { AppButton } from "@/components/ui/AppButton";
import { useTasks } from "@/hooks/useTasks";
import { spacing, typography } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import Papa from "papaparse";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

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
    row.priority &&
    !["LOW", "MEDIUM", "HIGH"].includes(row.priority.toUpperCase())
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
    row.status &&
    !["PENDING", "COMPLETED"].includes(row.status.toUpperCase())
  ) {
    errors.push(`Row ${rowNumber}: Status must be PENDING or COMPLETED`);
  }

  return errors;
}

export default function BulkUploadScreen() {
  const { addTask, findTask } = useTasks();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePickFile() {
    try {
      setLoading(true);

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

        Alert.alert("CSV Error", "The CSV file could not be parsed correctly.");

        return;
      }

      const headerErrors = validateCsvHeaders(results.meta.fields);

      if (headerErrors.length > 0) {
        console.log("HEADER ERRORS:", headerErrors);

        Alert.alert("Invalid CSV headers", headerErrors.join("\n"));

        return;
      }

      if (results.data.length === 0) {
        Alert.alert("Empty CSV", "The CSV file does not contain any task rows.");

        return;
      }

      const validationErrors: string[] = [];

      results.data.forEach((row, index) => {
        const rowErrors = validateCsvRow(row, index + 2);

        validationErrors.push(...rowErrors);
      });

      if (results.errors.length > 0) {
        console.log("CSV PARSE ERRORS:", results.errors);

        Alert.alert("CSV Error", "The CSV file could not be parsed correctly.");

        return;
      }

      if (validationErrors.length > 0) {
        console.log("VALIDATION ERRORS:", validationErrors);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bulk Upload</Text>

        <Text style={styles.subtitle}>
          Import multiple tasks from a CSV file.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>CSV File</Text>

        <Text style={styles.cardDescription}>
          Select a CSV file containing your tasks.
        </Text>

        <AppButton
          title={loading ? "Reading file..." : "Select CSV File"}
          onPress={handlePickFile}
          loading={loading}
          disabled={loading}
        />

        {fileName ? (
          <View style={styles.fileInfo}>
            <Text style={styles.fileLabel}>Selected file</Text>

            <Text style={styles.fileName}>{fileName}</Text>
          </View>
        ) : null}
      </View>

      {fileContent ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>File Loaded</Text>

          <Text style={styles.successText}>
            CSV file was successfully read.
          </Text>

          <Text style={styles.rowCount}>
            {fileContent.split(/\r?\n/).filter(Boolean).length - 1} data rows
            detected
          </Text>
        </View>
      ) : null}

      <AppButton
        title="Back"
        variant="secondary"
        onPress={() => router.back()}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {\n  return StyleSheet.create({
  container: {
    flex: 1,
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
});
}
