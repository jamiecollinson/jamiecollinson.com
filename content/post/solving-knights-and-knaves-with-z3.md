---
title: "Solving Knights and Knaves with Z3"
date: 2019-06-17
---

There's a type of logic puzzle called [Knights and Knaves](https://en.wikipedia.org/wiki/Knights_and_Knaves), in which we have a set of people who will either always tell the truth - a Knight - or always lie - a Knave.

Suppose we have two people, A and B, with A claiming "We are both Knaves". What can we deduce? A must be a Knave, since if he were a Knight he could not claim to be a Knave. Since Knaves always lie A and B cannot both be Knaves, and so B must be a Knight.

Can this type of problem be solved by a computer? We can clearly imagine a brute force solution, but if we can express this in a certain form we can use well established computational tools. I recently read [Hillel Wayne's post about solving the problem with Alloy](https://www.hillelwayne.com/post/knights-knaves/) (a SAT based modeller / solver) and thought it would be fun to show the same in Z3, an open source SMT Solver from Microsoft Research.

Installing the python interface to Z3 will also set up Z3 on your system (there's no separate installation needed):

```
pip install z3-solver
```

Once installed we can try to express the example above. We could get fancier with how we express things, but let's start with a variable for each person, which if `True` marks them as a Knight, and if `False` as a Knave.

``` python
from z3 import *

# True = Knight, False = Knave
A, B = Bools("A B")
s = Solver()

# "Both of us are Knaves"
s.add((A == True) == And(A == False, B == False))

if s.check() != sat:
    print("No solution")
else:
    print(s.model())
```

Perhaps the key condition needs a little explanation. Remember _we're_ not saying that both A and B are Knaves, only that _A says that A and B are Knaves_. We express this in Z3 by saying `A and B are both False, if and only if A is True`.

The rest is mostly straightforward, with the detail that before we can ask Z3 for the solution we must ask it to check the constraints - that's the `s.check()` part.

```
> [A = False, B = True]
```

Our program confirms that A is a Knave and B a Knight as we expected.

Let's try a slightly more complex example - A claims "Both of us are Knights or both of us are Knaves":

``` python
# "Both of us are Knights or both of us are Knaves"
s.add((A == True) == Or(And(A == False, B == False), And(A == True, B == True)))
```

We find:

```
> [A = False, B = True]
```

The more complex conditions might make us wonder if there are any other solutions. By design Z3 is only concerned with finding _a_ solution rather than _all_ solutions, but once we've found a solution we can look for another by re-running the checker with the additional condition that the solution must be different from the one just found. Wrapping that in a quick function is relatively straightforward[^1].

``` python
from z3 import *

def print_solutions(s):
    if s.check() != sat:
        print("No solution")
    else:
        while s.check() == sat:
            model = s.model()
            print(model)
            # Exclude current solution
            s.add(Or([d() != model[d] for d in model]))

# True = Knight, False = Knave
A, B = Bools("A B")
s = Solver()

# "Both of us are Knights or both of us are Knaves"
s.add((A == True) == Or(And(A == False, B == False), And(A == True, B == True)))

print_solutions(s)
```

We find two solutions, which makes sense - either A is lying in which case he's a Knave and B must be a Knight, or he's telling the truth in which case they must both be Knights.

```
> [A = False, B = True]
> [A = True, B = True]
```

Let's try another, A claims to be a Knave, then claims B is a Knave[^2]:

``` python
# "I am a Knave, B is a Knave"
s.add((A == True) == (A == False))
s.add((A == True) == (B == False))
```

```
> No solution
```

This has no solution as the first case contradicts itself - neither Knight or Knave can claim to be a Knave. We can verify this by trying the claim alone:

``` python
# "I am a Knave"
s.add((A == True) == (A == False))
```

```
> No solution
```

Let's try something different - A says "If you asked me, I would say I was a Knave". This is more subtle than the last examples. We can only trust that he would say what he claims if he's a Knight:

``` python
# “If you asked me, I would say I was a knave”
s.add((A == True) == ((A == True) == (A == False)))
```

```
> [A = False]
```

This makes sense, as we've already established the latter part has no solution, so the former must be false.

## Some more examples

Problem 1: There are two native islanders, named Alice and Bob, standing next to each other. You do not know what type either of them is. Alice says “At least one of us is a Knave.”

``` python
s.add((A == True) == Or(A == False, B == False))
```

```
> [A = True, B = False]
```

Problem 2: Again, there are two native islanders standing next to each other. You do not know what type either of them are. Claire says, "We are both Knights". After this Desmond says "Either Claire is a Knight or I am a Knight, but we are not both Knights."

``` python
C, D = Bools("C D")

s.add((C == True) == And(C == True, D == True))
s.add((D == True) == And(Or(C == True, D == True), Not(And(C == True, D == True))))
```

```
> [C = False, D = True]
> [D = False, C = False]
```

Problem 3: There are three native islanders, named Elena, Fernando, and Gary, standing together. You ask Elena, “How many knights are among you?”, and Elena answered but you couldn’t quite hear what she said. You then ask Fernando, “What did Elena say?”, and Fernando replies, “Elena said there is one knight among us.” At this point, Gary says “Don’t believe Fernando; he is lying.”

``` python
E, F, G = Bools("E F G")

s.add(
    (F == True)
    == (
        (E == True)
        == Or(
            And(E == True, F == False, G == False),
            And(E == False, F == True, G == False),
            And(E == False, F == False, G == True),
        )
    )
)

s.add((G == True) == (F == False))
```

```
> [F = False, E = True, G = True]
> [G = True, F = False, E = False]
```

Problem 4: You travel along a road that comes to a fork producing a path to the right and a path to the left. You know that one path leads to Death and the other path leads to Freedom, but you have no idea which is which. You can only choose one path to follow. Fortunately, at the fork in the road are two native islanders, named Horace and Ingrid. You know that one of Horace and Ingrid is a Knight and the other is a Knave, but you don’t know which is which. You are allowed to ask only one question. You can ask either Horace or Ingrid (but not both), and the person you ask will answer you.

This is the classic example, but needs more thought than the previous examples. We're not looking for single solution, but a question which will be answered consistently in all possible scenarios. Let's try the classic solution - "ask Horace if Ingrid would say left is the path to freedom":

``` python
H, I = Bools("H I")
Q = Bool("answers truthfully")

# one Knight, one Knave
s.add(Or(And(H == True, I == False), And(H == False, I == True)))

# we ask one about what the other would say about the left path, Q represents whether that answer is truthful
s.add((H == True) == ((I == True) == Q))
```

```
[H = False, I = True, answers truthfully = False]
[answers truthfully = False, I = False, H = True]
```

We can see that in all scenarios we get a lie, so can ask about either path and invert the answer to find the truth. Note that there is a simpler method - if we ask Horace if he would say left is the path to freedom, then he will tell the truth (and we can drop the condition about one Knight and one Knave):

``` python
H = Bool("H")
Q = Bool("answers truthfully")

# Ask H what he would say
s.add(H == (H == Q))
```

```
[H = False, answers truthfully = True]
[answers truthfully = True, H = True]
```

Cool huh, but what can you do with this besides solving toy problems? Any problem which can be expressed as a series of logical constraints can use SMT tools. Some interesting real world examples:

- Verification of program correctness - all preconditions, postconditions and program logic are modeled, then the solver checks the model is satisfiable.
- Allocation of virtual machines with varying requirements to bare-metal servers with varying resources.
- Automated program writing (!) from defined requirements.
- Automated circuit design from components / required outputs.

[^1]: N.B. this likely isn't efficient at all - don't use in production!

[^2]: Note this is different to the first case - there A was claiming that both he and B were Knaves, which is a less general claim.
