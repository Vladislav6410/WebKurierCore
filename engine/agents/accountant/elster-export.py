# 📁 engine/agents/accountant/elster-export.py

def generate_elster_xml(data):
    """
    Преобразует данные декларации в формат XML, пригодный для ELSTER.
    """
    # TODO: реализовать генерацию XML-структуры по шаблону
    xml_data = "<Elster><Year>{}</Year></Elster>".format(data.get("year"))
    return xml_data