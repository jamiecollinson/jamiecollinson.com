---
title: Notes on Category Theory for Programmers
date: 2019-05-14
---

## 1 Category: The Essence of Composition

- Categories consist of _objects_ and _arrows_ that go between them
- The essence of a category is _composition_, i.e. that `A -> B` and `B -> C` implies `A -> C`

### 1.1 Arrows as Functions

- Arrows are _morphisms_ which are equivalent to functions
- Objects are equivalent to types.
- If we have `f :: A -> B` and `g :: B -> C` then `(g . f) :: A -> C`

### 1.2 Properties of Composition

Composition in any category must satisfy two properties:

- Composition is _associative_, which means the order of brackets doesn't matter. This means for functions `f` `g` and `h`, `h . (g . f) = (h . g) . f = h . g. f`
- Every object has an _identity_ mapping back to itself. If we have `f :: A -> B` then `f . identityA = f` and `identityB . f = f`. Note the identity is per object.

### 1.3 Composition is the Essence of Programming

Why does this matter for programming? Because decomposing problems, creating solutions to simpler problems and then composing them is the essence of programming. Categories provide a mathematical basis for thinking about this.

### 1.4 Challenges

Q: Implement, as best as you can, the identity function in your favorite language (or the second favorite, if your favorite language happens to be Haskell).

A:
``` js
const identity = x => x
```

Q: Implement the composition function in your favorite language.It takes two functions as arguments and returns a function that is their composition.

A:
``` js
const comp = (f, g) => x => g(f(x))
```

Q: Write a program that tries to test that your composition function respects identity.

A:
``` js
const double = x => x + x
console.assert(comp(double, identity)(10) === double(10))
```

Q: Is the world-wide web a category in any sense? Are links morphisms?

A: Yes. If we view links between pages as a function from "visiting page A" to "visiting page B" then links are composable (a crawler could follow a chain of links equivalently to a single link), and pages are a category under links.

Q: Is Facebook a category, with people as objects and friendships as morphisms?

A: No, as friendship isn't composable (I may be friends with you, but some of your friends are completely unknown to me and thus not my friends), and there's also no identity function as people can't friend themselves. We'd need an identity and an axiom such as "the friend of my friend is my friend" for this to be a category.

Q: When is a directed graph a category?

A: A directed graph is a category provided we allow nodes to be adjacent to themselves, otherwise we do not have an identity function.
