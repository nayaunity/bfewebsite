import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
  intMode: 'number',
});

const prisma = new PrismaClient({ adapter });

const content = `My last Reel had a team behind it. Six AI bots scripted it, voiced it, found the footage and edited it while I was asleep. I woke up, watched the finished preview on my phone, gave one note, and posted it myself.

A lot of you asked how. So here's the whole system: every bot, every connection, every starter prompt, and the lessons that took my videos from "okay" to "this is great."

Quick introductions first. **Sterling** is my lead bot. He runs the team and is the only one I actually talk to. **Scout** is my footage bot, connected to my library of 1,836 clips from the last year, and he pulls the shot that matches every line. **Scribe** is my script writer. He studied dozens of winning videos on Instagram to learn hooks, pacing and structure, and he's plugged into my meeting notes and my second brain so he knows what I actually have to say. **Vicky** takes the script into ElevenLabs and builds the voice. **Curt** puts it all together: captions, color, brand style. And **QA** checks the footage and the edit before anything reaches me.

Every one of them is a [Grok Bot](https://x.ai/bot) with one job, its own connections and its own saved skills, and they hand work to each other in a group chat. Here's exactly how to build your own version. You don't need all six on day one.

## Part 1: What You Need Before You Start

1. **Grok Bot.** Every teammate in this guide is a Grok Bot with its own name and job.
2. **A footage library.** Wherever your raw clips live. Mine is Air, but Google Drive, Dropbox, Frame.io or a folder on your computer all work. Film vertical, face the light, shoot at eye level, and hold each shot 5 seconds or more.
3. **A notes app and a second brain.** This knowledge base is what makes scripts sound like you. I use Granola for meeting notes and Notion as my second brain. Use whatever you already write in, and start dropping in stories, opinions, wins and real numbers now.
4. **A voice.** Your own voice memos, or an AI voice. I use ElevenLabs, so have your account and API key ready.
5. **One reference video you love.** Pick a Reel whose captions, pacing and look you want yours to feel like. You copy the style, never the content. This is the single most useful thing you can hand your editor.
6. **Your rules, written down.** What never goes on screen, whether strangers' faces are okay, which folders are off limits. Rules you write once apply to every video after.
7. **Optional: your own sound effect files.** Add trending music yourself in the app when you post, since that handles licensing.

## Part 2: How the Pieces Fit Together

- **One bot per role.** Each teammate is its own bot with a name, a job and its own memory. That keeps each one focused and lets them work at the same time.
- **Connectors.** These are how a bot reaches your tools: notes, second brain, cloud drive. Ask a bot to connect a tool and it walks you through the sign-in. If a service has no connector, the bot can use its own browser while you do the sign-in. Only connect each bot to what its job needs.
- **Skills.** A skill is a saved workflow the bot follows every time, like "my caption rules." Every time you correct a bot, ask it to save the lesson to its skills. People skip this, and it's what makes video ten so much better than video one.
- **Routines.** A routine is a saved instruction plus a schedule or trigger, so a bot does the work without you asking. This is how you wake up to a finished video.

And the glue: a group chat. Put the bots in one room so they hand work to each other with @mentions, and you can drop in and see everything.

## Part 3: Where to Start

Don't start with six bots. Start with one editor bot and make one video together until you love it. That first video is where you teach it your style.

Once you have an edit you love, ask it to grow into a team. You can literally say: "Now that we've nailed my style, spin up the team: a voice bot, a footage scout and a QA checker." It will create each helper with its job, your rules and your style guide, with a note that each one reports back to it.

Then add a script writer when you're ready for scripts too. Here's each role.

## Part 4: Setting Up Each Role

### Role 1: The Editor (my Curt)

**What it does:** Storyboards, edits and renders the video. Captions, color, brand style, cut pacing, sound effects. It also checks its own work before sending you a preview.

**What to connect:** Wherever your footage and voiceover files land, and your fonts or brand assets if you have them.

**What to tell it in the first chat:** Your handle, the video type (voiceover over B-roll, talking to camera, or a mix), platform and length (vertical 9:16, the voiceover decides the final length), your reference video (the actual file or a link, not just screenshots), your fonts and colors if you have them, your never-show list, and whether it's sponsored.

**How it works with you:** It studies your reference and reports back in plain words, shows mockups one element at a time (a caption, a highlighted word, a big number, the hook) and waits for your yes, then a numbered storyboard, then the full render.

Starter prompt you can paste:

\`\`\`
You're my video editor. I make vertical short-form videos about
[your topic]. Here's my reference video: [link or file]. Study it
frame by frame and tell me in plain words what you see: cut pace,
caption font and size, how words appear, colors, graphics and
framing. Don't build anything yet. After I approve your read, show
me one mockup at a time on my own footage. Never render the full
video until I've approved every new look element and the
storyboard.
\`\`\`

### Role 2: The Script Writer (my Scribe)

**What it does:** Studies winning videos in your niche for hooks, pacing and structure, then writes original scripts in your voice, using only your real stories and numbers.

**What to connect:** Your meeting notes app and your second brain (for me, Granola and Notion), or a folder of your notes. This is its knowledge base, and it's the whole difference between generic content and content that's yours.

**What to tell it:** Your niche and audience, where your notes live, your tone and anything you never want said, who voices the script (first or third person) and your target length, where to save scripts (ask for a running index of used and unused ones), and whether you'll send winning videos or it should research them.

Have it study only recent videos that actually performed, skip ads, and log each one in a master spreadsheet (link, hook, format, why it worked) so you build a hook bank over time.

Starter prompt you can paste:

\`\`\`
You're my script writer. My niche is [topic] and my audience is
[who]. Read my notes in [notes app / second brain] before every
script. Study the winning video I send you for its hook, structure
and pacing, but never copy its wording. Rewrite it with my real
stories and numbers only. If a claim isn't in my notes, flag it for
me to verify instead of making it up. Write it exactly as it'll be
spoken, one short line per sentence, no production notes in the
text. Mark each line ON CAMERA or B-ROLL for the footage team.
\`\`\`

### Role 3: The Voice (my Vicky)

**What it does:** Turns the approved script into one clean voiceover track, plus a transcript with word timings and a line map so the editor knows exactly when every line starts and ends.

**What to connect:** Your AI voice tool (I use ElevenLabs) and its API key, or the folder where your voice memos land. Give the key through the secure request the bot shows you, never pasted into a regular message.

**What to tell it:** AI voice, your own memos, or both (if AI, which voice and tone), tight with no pauses or natural breathing room, how much processing (I keep mine minimal so it sounds natural), and who gets the finished track.

If you record yourself: one memo per line, retakes are fine, quiet room, phone a hand-width from your mouth, pause before and after each line.

Starter prompt you can paste:

\`\`\`
You're my voiceover builder. Take the approved script from
[script writer name] and build one clean voiceover with [voice
name] in [voice tool]. Keep processing minimal and level it so it
sounds natural. Hand the editor the final audio, a transcript with
word timings, and a line map with each line's start and end time.
Send me a preview as a short mp4 so it plays in chat.
\`\`\`

### Role 4: The Footage Scout (my Scout)

**What it does:** Searches your whole library and pulls the best shot for every line of the script.

**What to connect:** Your footage library. Air, Google Drive, Dropbox, Frame.io, or a folder on your computer. If your library tool has no connector, it can use its browser with you doing the sign-in.

The secret weapon is an index. Before it pulls anything, have it build a searchable spreadsheet of your library, one row per clip, logging what's on screen with timestamps (action, place, outfit, lighting, mood, whether you're on camera, the best few seconds, quality issues). It should look at real frames, not thumbnails, and work in small batches so it can resume. That's how it "searches every clip."

**What to tell it:** Where your footage lives and roughly how many clips, folders to skip or only use for certain videos (sponsored vs. not), who's on camera, and your rules on strangers' faces, other brands' logos and angles.

Rules I gave Scout that you can steal: aim for one different clip per cut, never use the same clip more than twice in one video, I'm on camera in most cuts, eye-level angles only (no up-the-chin shots), and never end the video on a shot without me in it. Same outfit in the same place counts as one look, so spread across days and places.

Starter prompt you can paste:

\`\`\`
You're my footage scout. My clips live in [library]. First, build a
searchable index of the library: one row per clip, logging what's
on screen with timestamps, the best 2 to 4 second windows, quality
issues and usage rules. Look at real frames, not thumbnails. Skip
[folders]. Work in small batches and keep a resume note. Show me
the folder list and clip counts before you start the first batch.
After that, for each new script, pull one strong clip per line and
hand them to QA with a note on which line each is for.
\`\`\`

### Role 5: QA (my quality checker)

**What it does:** Screens every clip before the edit (rejecting blurry, shaky, dark or low-angle shots and setup moments, and marking the best usable seconds) and checks every edit before you see it. It checks by looking at frames and measuring files, so have it tell you plainly what it couldn't check, like sound levels you need to hear yourself.

**What to connect:** The folders where the footage scout drops clips and the editor saves previews.

Starter prompt you can paste:

\`\`\`
You're my QA checker. Screen every clip my footage scout sends:
pass or reject with timestamps and reasons, and the best usable
seconds for each pass. Then check every edit before I see it:
captions match the script word for word, nothing covers my face or
hair, text stays in the safe zone, no clip used more than twice,
video ends with the audio, last shot is me. Write it up, send the
verdicts to the editor, and tell me plainly anything you couldn't
check.
\`\`\`

### Role 6: The Lead (my Sterling)

**What it does:** Runs the team. It takes your idea, kicks off each step, checks everyone's work, and brings you only the finished preview. You talk to one bot instead of five.

Starter prompt you can paste:

\`\`\`
You're the lead of my content team: [script writer name], [voice
name], [footage scout name], [QA name] and [editor name]. When I
give you an idea or a note, run it through the team in the group
chat in order. Check each person's work against my rules before it
moves on. Only bring me a finished, QA-checked phone preview and a
short note on what to look at. Never post or publish anything. I
post it myself.
\`\`\`

## Part 5: The Handoff, From Idea to Finished Video

Here's how one video moves through the group chat. Each step ends with an @mention to the next teammate, so nobody is waiting on you.

1. **You drop the idea.** A line in your notes is enough. The lead picks it up.
2. **Script.** The script writer pulls from your notes and second brain, models the structure on a winning video, and posts the numbered script. If you want to approve scripts, this is where you step in.
3. **Voice.** The script writer hands the final text to the voice bot. It builds the voiceover and posts the audio, transcript and line map. From here, that voiceover is locked: nobody retimes or trims it.
4. **Footage.** The footage scout reads the script and line map and pulls one clip per line from the index.
5. **QA screening.** QA passes or rejects each clip. The scout replaces the rejects. Only passing clips go to the editor.
6. **Edit.** The editor builds a numbered storyboard, then renders: captions, color, brand style, sound effects.
7. **QA on the edit.** QA checks the render against your rules. Problems go back to the editor, not to you.
8. **Lead check.** The lead watches the phone preview itself, then sends it to you with a short note.
9. **Your notes, by number.** Every cut has a number on the storyboard, so you can say "swap 17, make 16 bigger" and it's clear. The team changes only what you flagged and sends the next version.
10. **You post it.** Nothing goes live without you.

## Part 6: The Lessons That Made My Videos Good

This is the part that took me many rounds to learn. Give these to your editor and QA from day one and save them as skills.

**Captions**

- Caption every spoken word, in order. No paraphrasing, no skipping filler.
- Numbers as digits. "1,836," not "one thousand eight hundred thirty-six."
- Show 1 to 3 words at a time, in a fixed spot in the lower middle of the frame, inside the safe zone so the app's buttons and caption bar don't cover them.
- Words reveal in place. Each word appears in its final spot. Words already on screen never slide, re-center or re-wrap to make room for the next one. This one detail makes captions feel polished instead of jittery.
- Keep captions off your face and hair, with some breathing room.
- Don't put white text on a white wall or a bright screen. If there's no better spot, have the editor flag it with a still instead of adding a shadow you didn't ask for.
- Captions follow your script word for word. The recording only sets the timing.

**Footage**

- Pick the best part of each clip, not the first second. Raw clips usually start and end with you setting up the phone or walking away. I had to say this directly: "make sure you're not just starting from the 0s mark."
- Lots of different clips. Variety is what makes a video feel alive.
- Watch for flashes. A clip on screen for a split second can feel like a glitch. If something reads as jitter, cut it or give it more time.
- No surprise zooms, and keep your original color unless you approved a grade.
- Graphics look real, not cartoonish. If footage you need doesn't exist (like a scrolling feed), the editor can build it, realistically.

**Voice**

- One whole voice take for the final. The voiceover gets built once, approved once, and locked. Nobody trims or retimes it to make the edit fit. The edit fits the voice.
- No word clipped at a cut, the last word plays in full, and the voice sits even in both ears at a steady loudness.

**Process**

- QA before you see it. Your first look should be at a checked video, not a draft full of mistakes.
- Change only what's flagged. Ask for 3 fixes, get 3 fixes, everything else identical.
- Always re-render from clean sources, never patch an old render, and number every version (v1, v2, v3) so you can go back.
- Study a style reference. The editor studies the actual video, reports what it saw, and gets your yes on mockups before building. Ask for one recommended option, not a menu.
- Save every correction. When you say "this is great," ask the bot to write down what it learned in its skills. That's how the next video starts where this one ended.

## Part 7: The Daily Routine (How You Wake Up to a Done Video)

During the day: live your life. Drop experiences, ideas and meeting takeaways into your notes and second brain. That's your only job.

At night: a routine on your lead bot does the work. Ask your lead bot to set up something like this:

\`\`\`
Set up a routine for weeknights at 11pm: read what I added to my
notes and second brain today, pick the strongest story, and run it
through the whole team in the group chat: script, voice, footage,
QA, edit, QA again. Send me the finished phone preview here in
this chat by the time I wake up, with a short note on what it's
about and anything you want me to look at. If nothing new is in my
notes, tell me and suggest an idea from my backlog instead. Never
post anything.
\`\`\`

In the morning: watch the preview on your phone. Reply with notes by cut number, or say it's great. Post it yourself.

A few things to know about routines:

1. A routine can't sign in for you. Make sure every connector is connected and working before you rely on it overnight. If a connection expires, the bot should tell you what to reconnect.
2. Start with the least often schedule that works. A few videos a week you love beats a video a day you have to fix.
3. You can see and manage a bot's routines in its info pane (click the bot's name at the top of its chat).

## Part 8: Troubleshooting and Common Mistakes

**"The scripts sound generic."** Your knowledge base is too thin, or the script writer isn't connected to it. Add more real stories and numbers, and check the connection.

**"The captions jump around and feel jittery."** Words are reflowing. Tell your editor: each word appears in its final spot and nothing already on screen moves. Save it as a caption rule.

**"The clips are all the boring first second."** Tell your footage scout and editor to skip setup frames and pick the best window of each clip. Have QA mark the usable seconds during screening.

**"I asked for one fix and other things changed."** Tell your editor to change only what you flagged and to tell you if a fix forces a neighboring cut to move. Ask it to save that as a lasting rule.

**"The video won't play in chat."** Usually the file, not the edit. Ask for a smaller phone copy (H.264 with faststart) and have it resent.

**"My overnight routine didn't deliver."** Most of the time a connection expired. Reconnect it, then ask the lead to do tonight's run right now so you can watch it go through.

**"It keeps making the same mistake."** It wasn't saved. After every correction, say: "Save that to your skills so it never happens again."

## Part 9: Your Setup Checklist

**Before you start:** Grok Bot ready. Footage library in one place (cloud or a folder). Notes app and second brain with real stories and numbers in them. Voice ready: memos or an AI voice account and key. One reference video you love. Your rules written down: never-show list, sponsor rules, off-limits folders.

**The team:** Editor bot studied your reference, style approved, first video you love. Spun up the team from your editor. Script writer connected to your notes and second brain. Voice bot connected to your voice tool. Footage scout connected to your library, index built. QA checking clips and edits against your rules. Lead bot running one group chat with every bot in it.

**The rules, saved as skills:** Every word captioned, numbers as digits, 1 to 3 words in a fixed spot, words reveal in place. Best part of each clip, one locked voiceover take. QA before you see it, change only what's flagged.

**The routine:** Nightly routine set on your lead bot. Connections checked so the routine can run on its own. Morning: watch, give notes by cut number, post it yourself.

That's the whole system. Start with one editor and one video, teach it your taste, then grow the team around it. Then go live your life and let your team turn it into stories.

If you build yours, come hang out with us in [Disgustingly Paid](https://www.skool.com/startup-life-os-7440/about) on Skool. That's where we work through this stuff together every week. I want to see what you build.`;

async function main() {
  const post = await prisma.blogPost.create({
    data: {
      slug: 'ai-content-team-setup-guide',
      title: 'How to Build Your Own AI Content Team (So You Wake Up to a Finished Video)',
      excerpt: "Six bots scripted, voiced, found the footage, and edited my last Reel while I was asleep. Every role, every starter prompt, and the lessons that took my videos from okay to great.",
      content,
      author: 'Nyaradzo',
      category: 'Tech',
      tags: JSON.stringify(['AI', 'Grok Bot', 'AI agents', 'automation', 'content creation', 'video editing']),
      featured: false,
    },
  });
  console.log('Created:', post.slug);
}

main().finally(() => prisma.$disconnect());
