---
title: "Solving Knights and Knaves with Z3"
date: 2019-06-17
draft: true
---

There's a type of logic puzzle called [Knights and Knaves](https://en.wikipedia.org/wiki/Knights_and_Knaves), in which we have a set of people who will either always tell the truth - a Knight - or always lie - a Knave.

Suppose we have two people, A and B, with A claiming "We are both knaves". What can we deduce? A must be a knave, since if he were a knight he could not claim to be a knave. Since knaves always lie A and B cannot both be knaves, and so B must be a knight.

Can this be solved by a computer? If we can express this as an SMT problem we can use well established computational tools. Z3 is an efficient open source SMT Solver from Microsoft Research - let's try it out.

The Python interface to Z3 is a simple step away:

``` bash
pip install z3-solver
```
