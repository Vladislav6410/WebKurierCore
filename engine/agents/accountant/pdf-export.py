# 📁 engine/agents/accountant/pdf-export.py

from fpdf import FPDF
import json
import os

class TaxPDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, "📄 Steuererklärung", ln=True, align="C")

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Seite {self.page_no()}", align="C")

    def add_declaration(self, data):
        self.set_font("Arial", "", 12)
        for key, value in data.items():
            line = f"{key}: {value}"
            self.multi_cell(0, 8, line)

def export_pdf(json_path, output_path="steuererklaerung.pdf"):
    if not os.path.exists(json_path):
        print(f"[❌] JSON-Datei nicht gefunden: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    pdf = TaxPDF()
    pdf.add_page()
    pdf.add_declaration(data)
    pdf.output(output_path)

    print(f"[✅] PDF gespeichert: {output_path}")

# Пример использования
if __name__ == "__main__":
    export_pdf("engine/agents/accountant/output/steuererklaerung_2023.json",
               "engine/agents/accountant/output/steuererklaerung_2023.pdf")