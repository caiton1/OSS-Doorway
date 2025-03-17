import sys
import dspy
import json
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)


def load_json() -> list[str]:
    with open("/app/OSS-doorway/src/config/hint_config.json", "r", encoding="utf-8") as file:
        data = json.load(file)
    results = []
    for question, tasks in data.items():
        for task, hints in tasks.items():
            for hint_level, hint_info in hints.items():
                if hint_level in ['H1', 'H2']:
                    results.append(hint_info["content"])
    return results

def load_info(quest,task):
    with open("/app/OSS-doorway/src/config/response.json", "r", encoding="utf-8") as file:
        data = json.load(file)
    return data[quest][task]

def load_hints(quest,task):
    with open("/app/OSS-doorway/src/config/hint_config.json", "r", encoding="utf-8") as file:
        data = json.load(file)
    task_hints = data.get(quest, {}).get(task, {})
    hints = [task_hints[hint]["content"] for hint in ["H1", "H2"] if hint in task_hints]
    return hints
    
class RAG(dspy.Module):
    def __init__(self):
        self.respond = dspy.Predict('context, question -> response')

    def forward(self, question):
        return self.respond(context=load_json(),question=question)

def ragAnswer(quest,task):
    prompt = load_info(quest,task)
    hints = load_hints(quest,task)
    quest = f"""Based on this task and these hints create one new
    hint and return just that hint,task:{prompt},hints {hints}"""
    rep = RAG()
    return rep(question=quest).response
    

if __name__ == '__main__':
    print(ragAnswer(sys.argv[1],sys.argv[2]))
