import sys
import dspy
import os

api_key = os.getenv('OPENAI_API_KEY')

lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)
dspy.configure(lm=lm)

def addResponse(hint):
    qa = dspy.ChainOfThought("question -> answer: str")
    quest = f"reword this text:{hint}"
    rep = qa(question=quest)
    return rep.answer

if __name__ == '__main__':
    print(addResponse(sys.argv[1]))
