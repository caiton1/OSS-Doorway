import sys
import dspy
import json
import os
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

def load_json() -> list[str]:
    file_path = os.path.join("/app/OSS-doorway/src/config/response.json") 
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)  
    results = []
    for entry in data:  
        if isinstance(entry, dict):  
            for key, value in entry.items():
                if value:  
                    results.append(str(value))  
    return results

class RAG(dspy.Module):
    def __init__(self):
        self.respond = dspy.Predict('context, question -> response')

    def forward(self, question):
        return self.respond(context=load_json(),question=question)

def quizAnswer(answer,format):
    quest = f"""You are a strict formatter.  
        You will be given two things:
        1. An Input sentence containing the answer(s).  
        2. A Format string showing exactly how I want those answer values arranged, using placeholders A, B, C, … in the spots where each value should go.  

        Your job is:
        - Extract the answer value(s) from the Input.
        - Substitute them for the placeholders in the Format string, in order.
        - Output **only** the fully formatted result—absolutely no extra words, punctuation, or explanation.
        Examples:

        Input: "the answer is 15"  
        Format: "01"  
        Output:15

        Input: "the answers are  A, A, A A"  
        Format: "[A,B,C,D]"  
        Output:[A,A,A,A]

    Now do this:

    Input: {answer}  
    Format: {format}
    Output:"""
    rep = RAG()
    return rep(question=quest).response

if __name__ == '__main__':
    print(quizAnswer(sys.argv[1],sys.argv[2]))

