import { describe, expect, it, vi } from "vitest";
import { useExport } from "./useExport";
import { renderHook } from "@testing-library/react";

// Mock api and toast
vi.mock("../api", () => ({
    api: {
        lists: {
            sendListFile: vi.fn().mockResolvedValue({ error: null }),
        },
    },
}));

vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock XLSX
vi.mock("xlsx", () => ({
    utils: {
        json_to_sheet: vi.fn(),
        sheet_to_csv: vi.fn(),
        book_new: vi.fn(),
        book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
    write: vi.fn().mockReturnValue(new ArrayBuffer(8)),
}));

describe("useExport", () => {
    it("generates correct export data", () => {
        const { result } = renderHook(() => useExport());
        const items = [
            {
                id: "1",
                list_id: "l1",
                name: "Item 1",
                description: "Desc 1",
                importance: 3 as 1 | 2 | 3 | 4 | 5,
                estimated_cost: 10,
                is_adjudicated: false,
                image_urls: [],
                urls: [{ url: "http://test.com", label: "Link" }],
                created_at: "",
                updated_at: "",
                adjudicated_by: null,
                adjudicated_at: null,
            },
        ];

        const data = result.current.generateExportData(items);

        expect(data).toHaveLength(1);
        expect(data[0].Nombre).toBe("Item 1");
        expect(data[0].Importancia).toBe("Importante"); // 3 is Importante
        expect(data[0].URLs).toBe("http://test.com");
    });
});
