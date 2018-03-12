---
title: "Valuing a social network from first principles"
date: 2018-03-11T15:57:48Z
draft: true
---

I've recently been considering the problem of valuing a social network, and in particular one which is early stage and so doesn't have a well established market value (e.g. from public share price / known investments carrying professional valuation). My background is in products with recurring revenue, so I thought this would be similar, but it's more difficult than I thought.

Let's start with what we do know.

There exists a standard methodology for understanding & valuing software-as-a-service (SaaS) businesses. In a SaaS business customers pay on a subscription basis - typically monthly with a yearly discounted option - and as time goes on existing customers will stop using the service[^1]. We call the proportion who stop using the service in a given period the churn rate. If we assume this is constant[^2] then the mathematics of exponential decay tell us that the average customer will stay for `1 / churn rate` periods.

## Why is this useful?

Because it's hard to estimate how much to pay to acquire a user when all you know is they pay $x per month, but if you know the average user spends $x per month and sticks around for y months, some simple mathematics lets you treat the acquisition as a one-time sale. And so we've discovered the fundamental equation of SaaS:

> Lifetime value (LTV) = Average revenue per user (ARPU) / churn rate

To generate this revenue we have to a) create and maintain the service, b) market it and c) make a profit[^3]. In rough terms we might think each of those three should receive an equal share of revenue, and so we come to the oft quoted rule of thumb that for a SaaS business to be viable we need:

> Cost to Acquire a Customer (CAC) < Lifetime value (LTV) / 3

## How does this help with valuation?

In general a business is worth the value of it's assets plus some discounted rate of the sum of future revenues. In the case of a SaaS the fundamental equation helps us understand this future revenue, and by going further into the mathematics of exponential decay we have a good idea of how long they will last[^4]. I'm hand-waving the details here as they're situational, but it's clear we're can get a pretty good estimate with what we know.

## And what about social networks?

Can't we apply the same thinking to social networks? A network generates some amount of revenue per user, most commonly through advertising or premium services, so we can calculate ARPU. It also has a measurable rate of retention / churn, and so we can stick those values into the fundamental equation to get lifetime value for a user.

Unfortunately we have fallen foul of our previous assumptions. In the case of a service the income / churn are largely dependent on the usefulness of the tool. This may change with time but the effect of any change is likely to be gentle[^5]. The usefulness of a social network is a canonical example of a network effect. A social network with 10x as many users is much more than 10x as valuable to the users because many more than 10x connections are possible[^6].

This leaves us in a difficult place. The future value of existing users should grow as the user base increases - we'd expect people to stick around for longer and generate more income if the value of the network to them grows - but we also need to take account that every new user is also increasing the value of future users in a non-linear way. In short we have significant second order effects.

## What can we estimate?

When one approach stalls it's useful to consider others.

[^1]: As they either stop using it or go out of business.

[^2]: It's not, but it's a decent starting assumption.

[^3]: Otherwise we may as well not bother.

[^4]: c.f. [Half-life](https://en.wikipedia.org/wiki/Exponential_decay#Half-life)

[^5]: I originally wrote "linear", but I think "sub-linear barring discontinuities such as Google offering competing service for free" is probably more likely.

[^6]: [Metcalfe's law](https://en.wikipedia.org/wiki/Metcalfe%27s_law) suggests value grows proportional to the square of the number of users, and at least one study suggests this holds for social networks such as Tencent / Facebook.
