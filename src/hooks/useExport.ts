// src/hooks/useExport.ts

import * as XLSX from "xlsx";
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

    const exportToFile = async (
        items: ListItem[],
        format: ExportFormat,
        fileName: string,
    ): Promise<void> => {
        try {
            const exportData = generateExportData(items);
            const sanitizedFileName = fileName.replace(/\s+/g, "_");

            if (format === "json") {
                const jsonString = `data:text/json;charset=utf-8,${
                    encodeURIComponent(
                        JSON.stringify(items, null, 2),
                    )
                }`;
                const link = document.createElement("a");
                link.href = jsonString;
                link.download = `${sanitizedFileName}.json`;
                link.click();
            } else if (format === "csv") {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvOutput], {
                    type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${sanitizedFileName}.csv`;
                link.click();
            } else if (format === "excel") {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
                XLSX.writeFile(workbook, `${sanitizedFileName}.xlsx`);
            }

            toast.success("Lista exportada correctamente");
        } catch (error: any) {
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
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                content = btoa(unescape(encodeURIComponent(csvOutput)));
                fileExtension = "csv";
            } else if (format === "excel") {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
                const excelBuffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                });
                let binary = "";
                const bytes = new Uint8Array(excelBuffer);
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
