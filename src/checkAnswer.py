import sys
import dspy
from dotenv import load_dotenv
load_dotenv()

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

def checkAnswer(answer,realAnswer):
    qa = dspy.ChainOfThought("question -> answer: bool")
    quest = f"""if this answer is the similar as real, return true else return
    false, answer:{answer} real answer:{realAnswer}"""
    rep = qa(question=quest)
    return rep.answer

if __name__ == '__main__':
    print(checkAnswer(sys.argv[1],sys.argv[2]))
