from .analyzer import analyze_telemetry


class AIPilotAgent:
<<<<<<< HEAD

    def __init__(self):
        pass

    def analyze(self, telemetry: dict) -> dict:
        """
        Main AI analysis entrypoint
        """
        result = analyze_telemetry(telemetry)

        return {
            "agent": "AI_PILOT",
            "analysis": result
        }
=======
    def analyze(self, telemetry: dict) -> dict:
        result = analyze_telemetry(telemetry)
        return {
            "agent": "AI_PILOT",
            "analysis": result
        }
>>>>>>> 86ab79d (add engineer agent)
