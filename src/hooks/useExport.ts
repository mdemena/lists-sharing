// src/hooks/useExport.ts

import ExcelJS from "exceljs";
import { api } from "../api";
import toast from "react-hot-toast";
import type { ListItem } from "../types";

const priorities = [
    { id: 3, name: "Importante" },
    { id: 2, name: "Normal" },
    { id: 1, name: "Opcional" },
];

export type ExportFormat = "json" | "csv" | "excel";

export interface ExportData {
    Nombre: string;
    Descripción: string;
    Importancia: string;
    Coste: number;
    URLs: string;
    Estado?: string;
}

export interface UseExportOptions {
    includeStatus?: boolean;
}

export function useExport(options: UseExportOptions = {}) {
    const { includeStatus = false } = options;

    const generateExportData = (items: ListItem[]): ExportData[] => {
        return items.map((item) => {
            const baseData: ExportData = {
                Nombre: item.name,
                Descripción: item.description || "",
                Importancia: priorities.find((p) =>
                    p.id === item.importance
                )?.name || "N/A",
                Coste: item.estimated_cost || 0,
                URLs: item.urls?.map((u) => u.url).join(", ") || "",
            };

            if (includeStatus) {
                baseData.Estado = item.is_adjudicated
                    ? "Adjudicado"
                    : "Disponible";
            }

            return baseData;
        });
    };

    const generateCSV = (data: ExportData[]): string => {
        if (data.length === 0) return "";
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row =>
            Object.values(row).map(value => {
                const stringValue = String(value);
                // Escape quotes and wrap in quotes if contains comma or quotes
                if (stringValue.includes(",") || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(",")
        );
        return [headers, ...rows].join("\n");
    };

    const generateExcelBuffer = async (data: ExportData[]): Promise<ArrayBuffer> => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Items");

        if (data.length > 0) {
            const columns = Object.keys(data[0]).map(key => ({ header: key, key, width: 20 }));
            worksheet.columns = columns;
            worksheet.addRows(data);
        }

        return await workbook.xlsx.writeBuffer();
    };

    const exportToFile = async (
        items: ListItem[],
        format: ExportFormat,
        fileName: string,
    ): Promise<void> => {
        try {
            const exportData = generateExportData(items);
            const sanitizedFileName = fileName.replace(/\s+/g, "_");

            if (format === "json") {
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                    JSON.stringify(items, null, 2),
                )
                    }`;
                const link = document.createElement("a");
                link.href = jsonString;
                link.download = `${sanitizedFileName}.json`;
                link.click();
            } else if (format === "csv") {
                const csvOutput = generateCSV(exportData);
                const blob = new Blob([csvOutput], {
                    type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${sanitizedFileName}.csv`;
                link.click();
            } else if (format === "excel") {
                const buffer = await generateExcelBuffer(exportData);
                const blob = new Blob([buffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${sanitizedFileName}.xlsx`;
                link.click();
            }

            toast.success("Lista exportada correctamente");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al exportar la lista");
            throw error;
        }
    };

    const sendViaEmail = async (
        items: ListItem[],
        format: ExportFormat,
        listName: string,
        recipientEmail: string,
    ): Promise<void> => {
        try {
            const exportData = generateExportData(items);
            const fileName = listName.replace(/\s+/g, "_");
            let content = "";
            let fileExtension = "";

            if (format === "json") {
                content = btoa(
                    unescape(
                        encodeURIComponent(JSON.stringify(items, null, 2)),
                    ),
                );
                fileExtension = "json";
            } else if (format === "csv") {
                const csvOutput = generateCSV(exportData);
                content = btoa(unescape(encodeURIComponent(csvOutput)));
                fileExtension = "csv";
            } else if (format === "excel") {
                const buffer = await generateExcelBuffer(exportData);
                // Convert ArrayBuffer to Base64
                let binary = "";
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                content = btoa(binary);
                fileExtension = "xlsx";
            }

            const result = await api.lists.sendListFile({
                recipientEmail,
                subject: `Archivo de lista: ${listName}`,
                htmlContent:
                    `<p>Adjunto encontrarás la lista <strong>${listName}</strong> en formato ${format.toUpperCase()}.</p>`,
                attachment: {
                    name: `${fileName}_export.${fileExtension}`,
                    content: content,
                },
            });

            if (result.error) throw new Error(result.error);
            toast.success("Email enviado correctamente.");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al enviar el email.");
            throw error;
        }
    };

    return {
        exportToFile,
        sendViaEmail,
        generateExportData,
    };
}

export default useExport;
