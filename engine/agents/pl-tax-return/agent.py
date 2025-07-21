# engine/agents/pl-tax-return/agent.py
"""
Агент подачи налоговой декларации в Польше (PIT-37, PIT-36).
Автоматически собирает данные, формирует отчёт и экспортирует в XML или PDF.
"""

import json
import datetime
from pathlib import Path
from .parser import parse_expenses, parse_income
from .templates import generate_pit_xml, generate_pit_pdf

CONFIG_FILE = Path(__file__).parent / "config.json"


class PolishTaxAgent:
    def __init__(self):
        self.config = self.load_config()

    def load_config(self):
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        else:
            return {
                "language": "pl",
                "year": datetime.datetime.now().year - 1,
                "name": "",
                "nipt": "",
                "email": ""
            }

    def save_config(self):
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)

    def run(self, income_file, expenses_file, output_dir):
        print(f"[🇵🇱] Старт подачи декларации за {self.config['year']} год")
        income = parse_income(income_file)
        expenses = parse_expenses(expenses_file)

        print(f"→ Доходов загружено: {len(income)}")
        print(f"→ Расходов загружено: {len(expenses)}")

        xml_path = Path(output_dir) / f"PIT_{self.config['year']}.xml"
        pdf_path = Path(output_dir) / f"PIT_{self.config['year']}.pdf"

        generate_pit_xml(income, expenses, self.config, xml_path)
        generate_pit_pdf(income, expenses, self.config, pdf_path)

        print(f"[✓] Готово. XML: {xml_path.name}, PDF: {pdf_path.name}")


if __name__ == "__main__":
    agent = PolishTaxAgent()
    agent.run("data/income_pl.json", "data/expenses_pl.json", "output/")