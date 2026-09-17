# Start here: the NOCI stylist program

17 September 2026 · Hanna

## What this is

NOCI is testing one idea: if a real stylist gives a woman fifteen minutes and two looks that are actually right for her, for free, she will trust us enough to buy from us when our own pieces arrive this fall. Nothing is sold in this phase. We are proving that what we give is worth having, and learning what she wants while we do it.

You are the stylist. The tools below do the searching, the remembering and the layout, so your time goes on her.

**How one woman moves through it**

1. She takes the quiz at intheb.ag and gets a first read of her style.
2. She books a free fifteen minute call.
3. You open the stylist app, put in what she told the quiz, and run the call. The app gives you the next thing to say and you type back what she answers.
4. The app shops for her across the right stores for her age. You see the rack first and untick anything that is not her.
5. It builds two looks and one held in reserve, each as a collage with product cards. You edit anything, swap a piece, fix a line.
6. You send her the looks within 24 hours: a text with the board picture and a link, and an email as the copy she keeps.
7. Two days later you ask what she wore. That answer goes on her profile and makes the next call better.
8. She stays on the list for the first drop, and gets a useful tip from us now and then, never a sales push.

## The things you will open

| What | What it is for | Who uses it | Where |
| --- | --- | --- | --- |
| **The stylist app, in the bag** | Running the call, finding the pieces, building and sending the looks, keeping her profile | Every stylist, every call | https://claude.ai/artifact/QoU3KrgAKp4RpXJEWcriP8 (by invitation; sign in to Claude with the invited email) |
| **The app's source code** | Everything needed to change the app, rebuild it and publish your own test copy | Anyone building on the app | this repository; start with the top-level README |
| **The sales funnel** | How the whole thing works end to end | Everyone reads it once. Krish owns the numbers | [sales-funnel.md](sales-funnel.md) |
| **The styling playbook** | How we style, and why | Stylists. Hanna owns it | [styling-playbook.md](styling-playbook.md) and [stylist-intelligence.md](stylist-intelligence.md) |

The site and the admin live separately at intheb.ag. The admin is where leads, bookings and the call sheet are. The app is where the styling happens.

**Inside the app, the five doors**

- **Put her answers in.** She took the quiz. You enter what it told us, pick her brands, narrow it with her on the line, then run the call.
- **Skip ahead and just ask her.** No quiz. You say who it is for and type what she needs. The app asks the rest like a stylist would.
- **Just get a look.** Her name and one line. No questions, straight to the pieces.
- **This week's looks.** What Vogue, WWD, Elle and the rest are showing this week, with a line you can say. Use it to open a conversation, text her a tip, or start a mood board for her.
- **Her files.** One profile per woman: what we know, every look we sent, what she wore, notes.

## Your first day

About an hour, once.

- [ ] **Accept the app invitation.** It came by email from Claude. Sign in to Claude with the same address. The app holds client profiles, so it only opens for invited people.
- [ ] **Connect two tools on your Claude account.** In Claude, open connectors and connect **Firecrawl** and **Composio**. The app uses them to search the stores and pull the photos. Ask Hanna how to use the company's Firecrawl account so searches draw on the company's credits, not yours.
- [ ] **Open the app and tap continue.** The first time you search, a small box asks permission to use those tools. Say yes once.
- [ ] **Read the funnel document once.** Thirty minutes. Note anything unclear.
- [ ] **Skim the playbook's house rules, occasion conventions and language.** These are the parts that change what you say on a call.
- [ ] **Do two practice runs with just get a look.** Use a friend's real brief. Go all the way to the looks page, swap one piece with a link, edit one line, save the board picture.
- [ ] **Grade your own practice looks** in the feedback panel at the bottom of the looks page. That is how the app learns your eye.
- [ ] **Shadow two real calls, then run two with someone listening, then you are on your own.**

If a button does nothing or a photo is missing, take a screenshot and send it to Hanna with what you tapped. If a grey line starting with the word debug appears in the chat, copy that too.

## A normal day

| When | What you do | Where |
| --- | --- | --- |
| Morning | Check today's calls, do the two prep scores on each, see which looks and follow-ups are due | Admin, Today |
| Before a call | Open her profile if she has one. Read what she wore last time and any notes | App, her files |
| On the call, 15 minutes | Start from what is coming up and which side of it she is on, since a bride and a guest dress by opposite rules. Ask one thing at a time, offer choices, never make her invent an answer. Tap run with it when you have enough | App, the call |
| Right after | The rack appears. Untick what is not her, add a line if you want it softer or bolder, then build | App, the rack |
| Same day | Check both looks. Swap anything wrong with a link. Edit the wording so it sounds like you. Make sure every piece has a price and a picture | App, the looks page |
| Within 24 hours | Copy the text, save the board picture, send both. Send the email as the copy she keeps | Your phone, her thread |
| Every time | Grade the looks in the feedback panel: good, picture missing, wrong piece, story off, too old, too young, plus one line in your words | App, bottom of the looks page |
| Two days later | Ask what she wore, what she skipped, and why. Put it on her profile | App, her profile |
| Any quiet moment | Open this week's looks. If something is right for a woman on your list, tap text her this | App, this week's looks |

Fill in the write-up on the admin call sheet after every call. It is what tells us which quiz version produces the best calls.

## How we work on this together

**Who owns what**

| Thing | Owner | Everyone else |
| --- | --- | --- |
| This page and the playbook | Hanna | Comment or propose an edit |
| The sales funnel, the test read and the numbers | Krish | Comment or propose an edit |
| Her profiles and the looks | The stylist who took the call | Read, add notes |
| The app itself | Hanna, with Claude | Grade looks in the app, or build a change in your own copy and send it back |

**Three habits that keep this working**

- **Propose, do not quietly change.** Owners make the change. That way nobody's fix gets lost and we can see what confused people.
- **If a look is wrong, grade it in the app.** A fix you make quietly helps one woman. A grade helps every call after it, because the app reads the last forty notes before each call.
- **Ask when the page does not cover it,** and say what you did in the meantime.

**What we never do**

- No discounts, no urgency, no selling in this phase.
- Never comment on her body. Describe what a garment does.
- Never a celebrity photo in anything she sees.
- Never say algorithm or AI to her. Say stylist, pick, look.
- Never send a piece without a price, a picture and a working link.
- The occasion rules beat her colour preferences: a bride at her bachelorette wears white, a wedding guest never does.

## What is not built yet

- **Finding pieces takes a minute or two.** The app searches live and shows what it is searching while you wait. Plan to build the looks after the call, not during it.
- **Some product photos do not come through.** A few stores block us. The tile will say so, and you can replace it with your own photo or swap the piece with a link.
- **Her page is a saved file, not a web link yet.** For now the text carries the board picture and the product links.
- **Texts and emails are sent by hand.** The seven touches are written and the app drafts them, but nothing sends on its own until the messaging tool is connected.
- **Links are plain links.** We do not yet know whether she bought. Tracked links come next, so ask in the follow-up.
- **Her closet is not on her profile yet.** Adding her own pieces by photo or link is the next build, with a wishlist that watches for price drops.
- **The quiz on the site offers four colour palettes; the app works with eight.** Pick the closest and correct it on the call.
