00:00:00 Speaker 2
Let's go. Let me start again. We're thinking about specifying a game Hobo AI or Hobo Berlin, which describes the lives of a homeless person in Berlin. You start with three randomized characters. One is the former prompt engineer that got fired because loop engineering is all the rage. Another one is the former head of marketing who got fired because they got replaced with an end-to-end workflow. And the third one is a former QA engineer, which nobody needs anymore because you can generate Playwright scripts in three seconds. You have the following gameplay. You have to collect empty bottles on the streets and in the garbage bins. Then you have to exchange them as Pfand at Rewe to get some cash, and then you go to Netto to buy some food. You have three hearts. You have to survive one week until Agentur für Arbeit approves your money.

00:00:54 Speaker 2
And one day without any food or money, you lose a heart. And one night without a shelter, you lose a heart. So your main thing is to find bottles and find a safe place to sleep. And depending on who you start with, you have different levels of cash and different levels of stinkiness as well. Who has the most level of stinkiness? Product engineer, marketing manager or QA? Good question. We can randomize that.

00:01:25 Speaker 2
And your task is to survive one week. That's before a closing mind. That's the basic. Everybody is on board? Do we want to do that? Let's go.

00:01:38 Speaker 3
Few things that need refinement. We agreed on the whole goal and information, but for example, on the movement, how does the board unfold? Is it like a Mario style where you're walking in a path and trying to collect as much as you can?

00:01:53 Speaker 2
That's a good question.

00:01:54 Speaker 3
Or it's an open board and you move freely left and right, up and down.

00:02:00 Speaker 2
I thought about the corridor, actually, in Doom, you just have a corridor, and you can maybe it's a very simple labyrinth, like a little bit left, a little bit right, and then it kind of loops back or just ends like a dead end kind of thing. And sometimes you can find a treasure, like I don't know, ten plastic bottles, one liter plastic bottle.

00:02:21 Speaker 4
You don't know how many bottles are in a bin when you check it.

00:02:24 Speaker 2
You don't know and some, but maybe some sometimes you can get your head into something stinky and the stinkiness level increases, which decreases your chance that you're gonna get money. There's a chance that you bring the bottles, but they kick you out, and you lose the bottles or you come to the shelter and they don't let you in because you're too stinky.

00:02:46 Speaker 2
You need to balance.

00:02:55 Speaker 2
Maybe it's random, maybe there should be different bins. Maybe there is a good-looking bin, but you can get a lot out of it, but maybe you burn your finger because somebody left a cigarette in there and you don't get anything. Part of it is probably randomized, partly maybe by the look of it, like three levels of bins. And we need a timer to signify the night. If you didn't get twenty bottles and didn't get to Rewe within three minutes, that's like one day is three minutes for example. Very fast paced, like for TikTok generation.

00:03:39 Speaker 2
But we can also do the platformer. I think that was just a suggestion. Guys, if you like the Mario style or Prince of Persia style.

00:03:50 Speaker 3
No. I like all. I was going to ask which one is easier to build.

00:03:56 Speaker 6
I think the ones on the 2D style Pokémon game come closer.

00:04:06 Speaker 2
So we need to. You need a place. Maybe we move already? Or do you want to stay here for a while?

00:04:15 Speaker 3
Let's stay so at least we are okay.

00:04:18 Speaker 2
Let's stay. We're having a good vibe here.

00:04:22 Speaker 6
I think yes, the one which you two have for Pokémon Red and Pokémon Fire, like the 2D models, which we have the map, because there we can at least map how Berlin looks. And we can easily spawn each of these things. With Doom style, the only thing is mapping and then spawning each of the points or each of the places which you want to. So that's the only thing, but we can be in various stocks.

00:04:53 Speaker 2
I wouldn't do the whole map because it's difficult. We were discussing RTS and RPG approaches and it's not clear if we'll have time. We were also talking about procedurally generated maps. Maybe that could make it different, and we could take inspiration from Berlin, though it actually probably makes sense to say a simple map could be a very simple map.

00:05:27 Speaker 6
But when you click on some region, it will basically show you there in Pokémon they used to be a Pokémon Center.

00:05:35 Speaker 2
Go with you.

00:05:36 Speaker 6
And then your house. A simple map and then you can basically walk in this map.

00:05:43 Speaker 2
We can start with three locations for example.

00:05:46 Speaker 6
What is it?

00:05:48 Speaker 2
Cutie, for sure.

00:05:50 Speaker 3
Do you move between them? I'm trying to imagine you just click on them. It's mouse based, not keyboard based.

00:06:01 Speaker 2
I was actually thinking about phones. I was thinking about mobile. It's probably a web app, but I would want to make it work on the phone because I imagine people will work on the phones.

00:06:13 Speaker 3
But the system needs to go into an application. We can build it as a web, just a website.

00:06:20 Speaker 2
Responsive website.

00:06:24 Speaker 3
But I'm thinking

00:06:25 Speaker 2
Maybe React Native if there's another.

00:06:27 Speaker 3
Like how.

00:06:30 Speaker 2
Exactly the gameplay.

00:06:31 Speaker 3
Is it they click. So with this idea, it means they can like the places are there and they need to.

00:06:40 Speaker 6
They need to go to a region. Inside the region, it will look like this.

00:06:45 Speaker 2
I wanted to.

00:06:47 Speaker 6
Walk him something. We think this can be a better UI instead of very old. The list is a lot.

00:06:57 Speaker 3
Of a lot of visual assets to make it look like a full blown city. Versus, for example, I was thinking Mario because you just have ground, something to jump on. And this vertical thing, you need to jump to some place. There are only three kinds of paths you can take, and also three or four kinds of collectibles. And it's easier to build. And even the placing the items on the map, we can have just a two D array. We don't need to generate like in Doom style or in this. You would need to generate different look different places to look.

00:07:52 Speaker 4
Different. And I think probably it's better to develop a website for desktop because we are going to present it on the screen.

00:08:01 Speaker 2
The presentation is going to be?

00:08:06 Speaker 3
The beauty of the web is that you can put it, you can take the whole screen or it just takes this guy.

00:08:12 Speaker 2
She's right about it depends how you design it. If you design it for mobile, the stuff that you show on the screen is quite limited, so you don't need to generate a lot to have an experience working. I would actually even on desktop show it in the mobile format. I wouldn't stretch it out, I would design for vertical screens.

00:08:34 Speaker 3
For example, on the phone, you can find a collectible every three or four steps. If it's a larger screen, then you find one every six or seven steps. So just to expand the scale and widen it.

00:08:48 Speaker 4
I just look at this screen and imagine how to work here. I just look at this screen and imagine how it will look like.

00:08:58 Speaker 2
But basically in developer tools, F twelve right? I know how to use them. I'm not even saying we have to do developer tools for the presentation. Actually, I wouldn't. I'm just saying, with thinking, I'm just imagining we would come to the board and we would start designing on just one half. I would say that's what we should do because nobody's going to play this on desktop. But on mobile, when you're in the S-Bahn playing a Berlin Hobby, that's just stupid and funny gameplay. That's gameplay.

00:09:35 Speaker 3
Do we all agree on this?

00:09:38 Speaker 2
On the Mario thing? Could do the Mario thing. You didn't put in everything. I'm recording everything, I'm recording everything. I'm thinking about the concern I have with Mario. Why I was thinking about the Doom thing, for the same reason why this is complex? Because I think Mario is also more complex. Because if you have a Doom style thingy, the only thing that you need to design are the hands of the person, in one you have a bag with coins, another one you have a bag with bottles. And just the corridor and turn left, turn right, go straight.

00:10:23 Speaker 3
Which actually works better with our idea because we think so.

00:10:35 Speaker 2
I want to go inside the Spree. I wouldn't because it opens up. Then we need to create every space you can go inside. Even if you think about RPGs ten years, fifteen years ago, you couldn't go inside of houses most of the time because it just opens up the whole array of computational complexity.

00:10:53 Speaker 4
Actually we can reuse this game.

00:11:13 Speaker 3
We can build it, maybe like a two D space. And then if we have time, make it more like a first person, like you see scenes, different scenes.

00:11:26 Speaker 2
No, I would go with one approach. I don't think we need both, but we have an approach. Let's say, let's call it. What do you think about the initial thing that I suggested, the isometric map? This kind of map.

00:11:43 Speaker 3
Can you explain it more because I'm not.

00:11:46 Speaker 2
If you look at this kind of map, it basically shows you the view from above. It's kind of similar to this one, but it gives a little bit of three D perspective. I don't know if it's needed, maybe not, but I like this square thing. This little thing has squares. So you can only move by squares, which makes it kind of easier to place items and to move. Also, squares should be smaller than here. I would say. But still, it's basically a grid. And you look at it from above. And we have three locations: Kottbusser Tor, Alexanderplatz and. I've never been there; I don't know how it looks. And now I would make something famous like Alex Brandenburg and Kotti.

00:12:32 Speaker 2
Something that people would have grand and mugatois, you have a garbage bin there and you search for bottles near the brand. It's kind of funny.

00:12:39 Speaker 4
Grand is some more fancy

00:12:41 Speaker 2
Let's say it's more fancy and we can take a picture and ask AI to extract the bird's eye view.

00:12:49 Speaker 3
Pixelated for the art.

00:12:52 Speaker 2
Try, it asks AI to extract the positioning of stuff in JSON format, and then map it almost automatically on a location. And then the person, the character just runs around. It has three minutes, maybe just one minute to run around and then to go to the shelter. You need to go to a specific location on that little map. The map is limited. It's you maybe even see the limits of the map, maybe not because here you don't see the limits of the map. It's also interesting because you can explore more, but I'm thinking like we need to choose just one approach. I like actually this one.

00:13:28 Speaker 2
Because I think we have a little bit more freedom, maybe a surprise element. Mario approach, I find it a little difficult here because we still can do the Mario approach. We still can do Mario approach.

00:13:40 Speaker 3
But Doom also would work.

00:13:44 Speaker 2
Doom also would work.

00:13:45 Speaker 3
The game is not just about collecting, but there is also some interactions like with the Grinder or whatever else. I can see how that works with Mario. Because he's only collecting or avoiding something.

00:14:02 Speaker 2
But he's not doing stuff having something to do.

00:14:08 Speaker 2
So we're thinking about the 2D plane where the character is running around. What do we like more, guys? Do we like this little screen where the character explores or do we like the big screen where you see the whole map but you need to navigate it?

00:14:24 Speaker 4
I personally really like big screen. This one? No, this one. Oh, this one. Yeah, but not like in this position. But I think we can begin.

00:14:32 Speaker 2
Not isometric, but 2D. You like the 2D?

00:14:35 Speaker 6
We can view it from the top. We can view it from different angles as well. This particular one

00:14:40 Speaker 2
I also wouldn't do multiple angles at the same time.

00:14:44 Speaker 3
Two hours from before actual. What's easier? I think seeing the whole grid because we don't need to. Because if you're walking in the map, you need to kind of replace what's on the map left and right. I think it's simpler as well. And regenerate. You think it's simpler?

00:15:01 Speaker 2
Let's do the grid. Let's say I don't know fifty by fifty square grid with relatively like you just basically have fifty steps in one direction. It's fairly small or sixty four by sixty four. Let's do the power of two.

00:15:19 Speaker 4
Think if it's mobile, maybe not even a square.

00:15:25 Speaker 3
But just checking. So now let's go to the second thing: what kind of actions can they do? They can move.

00:15:39 Speaker 2
They can move left, right, up, and down. So 2D movement, they can collect bottles or interact with the garbage bins to collect a bottle or get burned.

00:16:02 Speaker 3
So it's not like Sonic, for example, where you see here is a coin, here is ten or here is one bottle, next ten bottles. You kind of go to the place.

00:16:11 Speaker 2
I think it should be unpredictable. Part of you doesn't know what's going to happen. Because otherwise, if you see the whole map and you know where everything is, then just run there and collect it. There's no challenge.

00:16:25 Speaker 3
We can make it harder in the next iteration, but let's think of how we want it to be in the final shape.

00:16:35 Speaker 2
In the final shape, I'm thinking you have different garbage bins where you search, but you can also have some places that may not be clear if they're interactable.

00:16:46 Speaker 3
Like you usually there is an Uber Arena, there's a concert and everyone going there to leave their stuff.

00:16:54 Speaker 7
From you free, no one had any dietary restrictions.

00:16:58 Speaker 2
Dietary? No.

00:16:59 Speaker 7
Everything is fine so far.

00:17:02 Speaker 2
So a quick question: I logged in the enterprise thingy, but I have my own Codex. How do I? Do I have to? You can use on what you want on login.

00:17:13 Speaker 2
But I just don't have that many. I have here, I just have a twenty euro thing.

00:17:18 Speaker 7
So for the OpenAI partnership, one, it's not working out of the box right now for you.

00:17:25 Speaker 2
I just have my own Codex with my own license. So I'm asking how do I connect?

00:17:29 Speaker 7
Had the same issue. I had the same issue because I have the Codex license and the OpenAI partnership one. So everyone who was invited got sent an email with the Codex access.

00:17:44 Speaker 4
Can I also get an email with Codex access? I didn't get an email.

00:17:48 Speaker 7
You don't have you don't have it?

00:17:50 Speaker 4
I didn't get the email.

00:17:51 Speaker 7
Didn't get any? Then I will check again, because everyone should have it in the workspace: OpenAI Partnerships. And maybe could you show it to me?

00:18:00 Speaker 4
Just. I have my own.

00:18:04 Speaker 7
You're not supposed to use your own.

00:18:15 Speaker 5
I can open it, but I don't know.

00:18:26 Speaker 6
What's that view model called? The one. Sorry? What's that view model called? The board.

00:18:32 Speaker 2
This one? Isometric. Isometric view. So let's come back to the actions slash interactions. The character, the hobo can collect bottles from garbage bins. Sometimes, we can spawn some bottles in random places, and you don't know how many there are, and they may be kind of far away. You might lose time if you're somewhere at the edge of the map. You might lose time and not get back to the shelter. But maybe you pick up ten bottles and then you're good for the week.

00:19:11 Speaker 4
So we need to track time as well.

00:19:13 Speaker 2
We need a timer. But we're talking about the interactions first, right? Antoine: Yeah. You wanted to talk about interactions. So you can collect bottles, then you can give up bottles. Oh my god. These guys are distracting me. Get money and buy food.

00:19:44 Speaker 6
Connect bottles.

00:19:48 Speaker 2
Money and buy food, and apply for shower. So basically four actions. And walking.

00:20:01 Speaker 3
You buy food from a different place than you deposit the bottles?

00:20:07 Speaker 2
I would say so or maybe you can do both. But in REWE, you get maybe more money for your bottles or the same money. I think the fund is the same everywhere. You get the same money, but the food is more expensive. Maybe REWE is better. And in Netto, you cannot maybe give up bottles because actually some shops don't accept bottles that easily. But the price is cheaper. If you have a lot of bottles and you don't care, and you hope the next day will be better, you just go to REWE and give.

00:20:41 Speaker 2
Up bottles there, you buy food there, but then you're low on cash. Maybe you won't have enough money to pay for the shelter. I don't know if you actually have to pay for the shelter or you just have to reach it. Maybe just reach it.

00:20:55 Speaker 3
You can decide later. This also losing the hearts or losing something in the game also needs requirement.

00:21:05 Speaker 5
Because you have to accept it.

00:21:07 Speaker 2
But with actions? Be good, right?

00:21:10 Speaker 6
We are the actions, but then I think that comes the part of how we handle the metadata. We got the food, we ate the food and that will basically recharge our bar. And that bar will basically deplete as the time goes. That is one thing. We try if we are even doing more, also consuming energy. So that will be an energy bar. The energy bar will represent it.

00:21:40 Speaker 6
You die. No

00:22:04 Speaker 3
I want to make it a hardcore game over like you're done, bro.

00:22:09 Speaker 2
Your whole life is fucking over.

00:22:11 Speaker 3
Because the hearts or collecting hearts or lives, I don't think it applies to this.

00:22:18 Speaker 2
And I wouldn't collect them, but I was thinking of having them. And if you didn't eat for a day, you don't die immediately. That's why I was thinking about hearts like if you lose one heart, you don't have shelter. You lose a second one and then you're just on your second day, and it's not great.

00:22:36 Speaker 3
It's hard to reach that state in the demo part because it would require at least five minutes of play or more.

00:22:48 Speaker 2
Can have one minute rounds.

00:22:50 Speaker 3
We can have the happy path. So build on the happy path, maybe this part of.

00:22:59 Speaker 2
I mean in game you have to have the losing thing because otherwise it's not a game. Losing in games is a very natural, normal kind of thing which gives you feedback. You messed it up. It gives you negative feedback to improve. If you only have a happy path, it's not really a game. It's not interesting because you don't have a risk. So I would have the game over. The question is how we do it because we can have a depleting bar which goes dynamically.

00:23:26 Speaker 6
I think as soon as it goes down, it will reduce your heart and consume the heart.

00:23:34 Speaker 2
It will again refill. So maybe you start moving slower. That is something we can do a trial.

00:23:47 Speaker 6
Maybe, if you want to be just like this, if you want just the hearts to be a very absolute measure of your energy or life. We can gradually decrease the heart, like your one heart.

00:24:02 Speaker 2
But it's the same thing.

00:24:04 Speaker 6
It will keep on decreasing, decreasing, decreasing. So we need not maintain a different energy bar. But I like the idea of having this.

00:24:14 Speaker 2
Bar for everything. Actually, don't know if we need to deplete it because we already have a timer. We already have a timer that the day ends. The day ends, you didn't find the shelter, heart is out. So I don't know if we need the energy.

00:24:31 Speaker 3
A new dimension, like with grabbing bottles and exchange for food. That's a clear path, but what happens with the shelter?

00:24:43 Speaker 2
Just have to reach it until the time is out. A good question. I was thinking that first of all it's realistic; you need to sleep somewhere. That's often actually the main problem for homeless people, where to sleep and not die, especially if it's winter.

00:25:04 Speaker 3
For me, I always see a homeless person on the street. I never think about their life before or after this moment. So maybe with the shelter, I don't know what it adds.

00:25:18 Speaker 4
And they just need to sleep in shelter otherwise they will die. Otherwise they will die.

00:25:24 Speaker 3
I know, but as a first person, I see them at a point in time collecting bottles. That's all I know about their life or in the space. So the shelter part, if it's not going to add something valuable to the game.

00:25:44 Speaker 2
Maybe you can drop it. I was just shelter how does the game end? And if you don't get the shelter, you get minus heart or if the time runs out, you get minus heart. Maybe it's enough. We can go without shelter.

00:26:01 Speaker 3
Off like this: you go to complete missions and then go to the shelter. Then we would want to add an aspect, like this is the next day now you start with a full life. It needs to have some consequences.

00:26:19 Speaker 2
The consequence is, you lose a heart. If you don't stay there, you get a heart and I wouldn't get all the hearts, but just one heart for one night. If you stay in the shelter, that's the consequence. You have seven days to survive in the same location, but the bottles are spawned in different places. You have seven one-minute rounds. We can also do without shelter, because we have a timer. Time runs out minus heart will make a simple animation.

00:26:51 Speaker 2
Kind of goes dark, the moon comes out, the sun comes like a three second animation. We can replace shelter with just doing the thing. If you didn't eat, let's say if you didn't eat within this one minute, then you lose a heart. If you did eat, minute ends, you're good.

00:27:12 Speaker 4
But I think adding shelter which represents night makes sense, and it makes the game more interactive. Because just collecting bottles is a little bit boring. But more interaction makes it more interesting.

00:27:25 Speaker 2
We can start without it. I also think shelter is fine, but we can start without it.

00:27:35 Speaker 3
Start without it. Also, we are four people and I think there would be a moment where we work in parallel on different stuff. So we can iterate when the.

00:27:46 Speaker 2
That's actually a different good question. How do you actually work in parallel on such a task? Because the task itself, we hopefully going to finish specing it out in next fifteen minutes. I'll transcribe it. I can make a repo and share the transcript in the repo, for example. But then how do we start? Some of us, one of us can just run five six SOLO Ultra on their enterprise license, and that's it. You can just run the thing and maybe it's going to be enough.

00:28:15 Speaker 4
We can think about tasks which can be parallelized. For example, creating images and animation.

00:28:23 Speaker 2
For example

00:28:24 Speaker 4
We still can introduce character. It's also a separate task. For example

00:28:28 Speaker 2
You choose the style of beard.

00:28:30 Speaker 4
Maybe for example in games. Actually. I Think.

00:28:38 Speaker 3
It's a good way to add this, for example, instead of you just moving on the map. Get bottle put it. We can also start having text bubbles like can I?

00:28:51 Speaker 4
I burned my finger! Some voice, some audio.

00:28:56 Speaker 2
Can you generate? We also need some sounds when something happens. We need sounds.

00:29:01 Speaker 4
Can you generate this with OpenAI or does it not support it? Sounds and generation.

00:29:07 Speaker 2
I don't think so, but we can do it with Eleven Labs. Eleven Labs is it free? No, it has text to voice. Text to sound. They can make sound effects, not just voice.

00:29:23 Speaker 3
It could be like nineties games, just the text bubble. He doesn't need to speak. You just as a.

00:29:30 Speaker 2
Not the speaking, but sounds signifying you. You pick up bottles, you get doo-ding. You give them up. You're like doo-doom. You didn't eat. You're like doo-doom. Yeah, I agree. That tops. If we have.

00:29:47 Speaker 6
I think one.

00:29:48 Speaker 2
That's a that was actually a good idea.

00:29:50 Speaker 6
Media 6-1 can work on all or US 6.

00:29:54 Speaker 2
But I didn't finalize the gameplay because when I open, let's say I go to Hobo Berlin, what happens? I go to Hobo. Maybe we should draw it?

00:30:08 Speaker 3
These are whiteboards. Wow, why did we use it?

00:30:12 Speaker 2
Uh, I mean, I didn't think we needed it yet, but uh or maybe we did. Do we have some markers? Uh, hey guys, do you have something to draw on the whiteboards?

00:30:23 Speaker 7
I can ask for it.

00:30:27 Speaker 2
Thank you. One what?

00:30:31 Speaker 7
No, not you. I'm gonna ask the campus to provide us with.

00:30:36 Speaker 4
Is there a way to generate videos with OpenAI?

00:30:41 Speaker 7
I think they have their.

00:30:44 Speaker 2
Sora.

00:30:45 Speaker 7
What was Sora?

00:30:47 Speaker 2
But they did not anymore

00:30:49 Speaker 7
They deprecated it. I think it's not possible anymore. Did you get access yet? I got it. Did Reduan talk to you regarding the change of your

00:30:58 Speaker 2
Regarding the change, we haven't started coding yet.

00:31:05 Speaker 2
How do I log out?

00:31:07 Speaker 2
Like This.

00:31:17 Speaker 2
Update now execution.

00:31:22 Speaker 2
Update. Let's skip it sign in. I think it's just what's going on.

00:31:35 Speaker 6
Choosing cup.

00:31:37 Speaker 5
What's going on?

00:32:08 Speaker 6
You are, so we can generate it by HTML or GIF something.

00:32:13 Speaker 2
It's not the right animation.

00:32:16 Speaker 6
A GIF animation can be generated by a code. What's that? I think so.

00:32:23 Speaker 3
We can build this with CSS. I will take over this character build up and handle it.

00:32:30 Speaker 4
I mean another, which we discussed, an animation, like if you collect the bottle, show something like bottle collected.

00:32:38 Speaker 5
Did you already take a look at those MD files? Especially for the first episode of the ideation phase and thinking about the planning architecture, it's very useful to fill those out. Go back and forth a little bit so that Codex also understands from the ideation from the start and uses that context for future events. Definitely try to get them more.

00:33:03 Speaker 2
Fucking hell. It doesn't work but let's send, let's handle this later, guys. Let's thank you. Let's just start designing. I'll log in the break or not to hold up the whole team. So where is okay? Let's start with some fucking frame. Let's start with the frame. Just do that's our screen.

00:33:38 Speaker 2
We need some sort of controls for this little hobo to run around. Arrows, I guess on the left side. I would say left side arrows, right side action button. Something like very simple. I'm not good at drawing. I'm just like something like this, like a Game Boy like that. And maybe we can even split the screen and leave this part out just for the controls, or we can overlay it on the map.

00:34:15 Speaker 3
Also, if you wanted to make it playable on a phone, by default, the users will learn WASD movement with arrows or with W.

00:34:27 Speaker 2
A S D.

00:34:28 Speaker 3
We assume they know that. So no need to render them; it's gonna take from the whole experience.

00:34:38 Speaker 2
But on the phone, what are you going to do on the phone? You have to.

00:34:45 Speaker 2
But how do I mean? You need some elements. You move with a touch-based.

00:34:55 Speaker 2
You mean you just tap on the map?

00:34:57 Speaker 3
No. If you move like this, he walks half a step. You can just keep.

00:35:04 Speaker 2
Oh no, that's not gonna work. If you have sixty four things, then you have to do it sixty four times.

00:35:11 Speaker 3
I think this one is.

00:35:12 Speaker 2
How would you do it? You just press the thing and it runs.

00:35:16 Speaker 3
So on the keyboard, he wanted to also be if you long press, he moves multiple steps.

00:35:21 Speaker 2
You just continue walking here. Runs, I mean, if it's sixty, if it's sixty four, it's just too many.

00:35:29 Speaker 3
So it could be continued.

00:35:31 Speaker 2
But if you're right, maybe we don't need controls, but then we need to interact with the map. We should be able to tap on the map. You tap something, it walks there.

00:35:42 Speaker 2
It's maybe difficult. I don't know if it's more difficult to implement or if it's easier. Maybe map is better because he was one event.

00:35:49 Speaker 6
Just wait. I have no idea.

00:35:53 Speaker 2
I have no idea.

00:35:54 Speaker 6
With the visual and then so I think

00:36:09 Speaker 4
Does it even support if you open it in a web touch screen? I know it supports for its native, but if you open in a browser, I'm not sure that they even support to do all this because it's not a native application.

00:36:23 Speaker 3
Think if you make it the mobile simulator, the cursor turns into this snappy thing. But we don't need it in the first phase. We can just play with the arrows; it's still totally fine. We are building iterative rules. I think if you are able to visualize, that can help you to make some of let's draw the board, let's say imagine the character moving so if it touches a bottle, what happens? If it goes to.

00:36:55 Speaker 2
And if we have a map inside it, do you want to do full screen or do like margin border? Full screen.

00:37:08 Speaker 6
And then we can show the legends like how many hearts you have on the top. See the three hearts, you know only have three hearts.

00:37:21 Speaker 2
If somebody wants to take over the drawing, let me know. I'm fucking horrible. I'm just very schematic. Do we introduce stinkiness?

00:37:34 Speaker 6
I think that's true.

00:37:36 Speaker 2
But if we don't have shelter, stinkiness kind of loses the point. I mean maybe he doesn't get let into the shop, but I don't know if we need it another one maybe later.

00:37:45 Speaker 6
Let's have it as a placeholder. We might add it as a future improvement and think about how it can help.

00:37:58 Speaker 2
There could be his name.

00:38:00 Speaker 3
For example.

00:38:03 Speaker 2
Let's be Josh. Something like this? Yes. What happens on the map? Let's take a location like Brandenburger Tor.

00:38:19 Speaker 4
Let's put three locations here.

00:38:22 Speaker 2
I would just do one location first because we can even start with one. Locations I think is a good idea, but we can start with one. So we'll just model one location because multiple is a

00:38:33 Speaker 3
So let's assume there's a trash bag. There's a river. There's a donut. And here's our character.

00:38:49 Speaker 6
Imagine what happens when he touches or goes to each point to imagine the gameplay. Then it's an interaction type. Then you click on the pen. We need to have data. How many bottles do you have? One more.

00:39:23 Speaker 2
We forgot the bottles. That's true. How many bottles? So much money. How look at this money?

00:39:30 Speaker 3
Bottles and money is true. It's Euro. We're Berlin man. It's Euro Europa! Europeans.

00:39:41 Speaker 2
And I think the number of

00:39:47 Speaker 6
We will have a drawing of bottles.

00:39:49 Speaker 2
So sign. But why did you draw it outside of space?

00:39:58 Speaker 3
I was. Just 78 bottles. That's perfect. So what happens when he comes here? Because at first I thought the easiest is there are bottles directly, so he like if it's a trash bin this size, you can collect ten. If it's this size, you can collect twenty five. That makes it easier.

00:40:25 Speaker 4
That is too much, but one to five is enough.

00:40:28 Speaker 2
But don't get his life too easy. I mean, it will be heavy.

00:40:33 Speaker 3
To carry also many bottles. We can discuss the numbers, but this makes it easier that there is no interaction. Dennis's idea was he is putting his hands and he might get burned.

00:40:48 Speaker 2
But I wouldn't show it. I wouldn't show it.

00:40:50 Speaker 3
But I don't know how to make it work.

00:40:52 Speaker 2
I would have you tap on it. You interact, and there is a positive outcome and a negative outcome with certain probabilities. Ding! And then it shows a little icon, just an icon with bottles or an icon with a burn. And if it's an icon with the burn, half of the heart goes away. And if it's an icon with the bottles, the number of bottles goes up.

00:41:14 Speaker 6
So the bin will always be a mystery. We don't know how many bottles.

00:41:17 Speaker 2
Mystery bin.

00:41:20 Speaker 4
It's a random number of bottles.

00:41:24 Speaker 6
When you interact. Only when you interact, you'll know.

00:41:28 Speaker 2
And some bottles can just lie around at the doner kebab, but usually not many. They can respawn from time to time. I would place bins in different places. Not very realistic, but at every level at least you get some difference. I would place bins randomly, not entirely randomly probably, but in different places at that new level.

00:41:52 Speaker 3
A box has random bottles.

00:41:54 Speaker 2
Or some negative like a burn or stinkiness.

00:41:58 Speaker 3
Negative output may burn and make it stinky.

00:42:04 Speaker 2
I actually think burn is simpler. Burn just takes away half a heart. You burn it, it takes away half a heart.

00:42:12 Speaker 3
Can he be both burnt and get bottles?

00:42:15 Speaker 2
I would say no. I would say just one.

00:42:18 Speaker 4
And let's have only one being burned,

00:42:21 Speaker 2
Still on the outcome. Only one been? So if you got burned once on the map, you're like "woohoo!" Could be. Oh maybe. But a limited number of burns is good. Because otherwise you just burn your ass in the first ten seconds.

00:42:40 Speaker 3
So for each game, there is only a single bin with one.

00:42:47 Speaker 2
Or two bins. We can try it. We can start with the number of bins.

00:42:57 Speaker 3
Maybe some percentage of the bins is good. It keeps it.

00:43:02 Speaker 2
Limited but keeps it unknown. Limited but unknown is good. It gives this kind of slot machine effect that we are evil. We are fucking evil by the end of the day. Everybody's in their room playing this fucking game, cannot get off and oh can I get some cocaine into the game please? They're like twenty bucks for token credits.

00:43:28 Speaker 3
Assigned to ten percent of.

00:43:34 Speaker 3
And we can have some sound effects. Anything else with the band? We have a random number possibility of burn, which affects the heart, and there are ten percent.

00:43:50 Speaker 4
Maybe some beans have some medicine, which increases the number of your lives.

00:43:57 Speaker 3
Make that maybe we make that life with donut with eating.

00:44:01 Speaker 4
So you can buy either food or medicines.

00:44:05 Speaker 3
A representation of good or bad. Doesn't need to be that realistic.

00:44:11 Speaker 2
Could do it in one of the iterations because I think there is a difference. For example, you could ask for a donor and maybe sometimes you get it without money. But in the pharmacy, you never get it without the money. But maybe it's the next step. I don't know. Me neither. Maybe that's the reason.

00:44:36 Speaker 3
Then do we have a minimum for them to go to river?

00:44:41 Speaker 2
Minimum, I don't think so, but it's a wait time in river. It's a wait time. You have to wait for ten seconds, for example. You have sixty seconds for a round. You need to wait for ten seconds at river.

00:44:59 Speaker 3
Needs to have, Like and was it?

00:45:01 Speaker 2
Where is the timer, guys? The timer needs to maybe that's the thing. We need time.

00:45:07 Speaker 3
That's the thing. I thought that instead of hearts being like one or two or three, it is a bar. But the bar, the more time passes, it gets low. When you come here, it gets higher. The wait time makes it keep going low.

00:45:31 Speaker 2
I think it's complex mechanics.

00:45:33 Speaker 3
So it's a different representation.

00:45:37 Speaker 2
It's not really because the timer is within one round; we have seven rounds. The whole game is seven rounds; hearts are cutting through seven rounds. You need to keep at least one heart at the end of the seventh round to win.

00:45:50 Speaker 2
Seven nights.

00:45:55 Speaker 2
Before to prove your money, and then you win. And you have to survive seven nights. At every night, at every morning, we regenerate the beans. You need to recollect them. Your money stays, your hearts stay. I think I would say, hearts don't change if you don't have shelter mechanics and all that, hearts don't change but the timer is within the round. If the timer is up and you didn't eat, you didn't have enough money, which is say five euro. Also needs to do some sort of threshold, or it's five euro in river, two euro in donor. But maybe it's too complex. But what I'm trying to say is that timer is up, the day is done, you lose a heart and it restarts.

00:46:40 Speaker 3
Let's

00:46:41 Speaker 2
But the time I would just keep the timer simple because we could do mechanics that get tired. It's a cool thing and a lot of games do that. I just don't know if I have time for it.

00:46:52 Speaker 3
Let's try to commit to this idea. The timer keeps depleting from the moment we start the game.

00:47:02 Speaker 2
User has to press start. I would say you have to actively once we start.

00:47:07 Speaker 3
Yeah okay.

00:47:08 Speaker 2
And on the screen we have to also explain the rules. But it's later.

00:47:14 Speaker 3
We need to communicate that users know their rules. We can show the first screen explaining the rules and then.

00:47:21 Speaker 2
Hobo in Berlin, you need to survive seven nights.

00:47:24 Speaker 3
It could be added. We were working parallel. So here this wait time, how to represent? Do we have multiple ravens with different wait times?

00:47:39 Speaker 6
Let's say maybe LD has eight seconds.

00:47:46 Speaker 2
Maybe Rewe has 10 seconds to get bottles, it has five more seconds to buy something. But it gets you completely ready, right? In Doner, for example, maybe you don't have a wait time, or you have two seconds wait time, but you need to eat twice if you Doner.

00:48:14 Speaker 3
You can only buy. Let's say the Doner is ten euros. And here, let's say the bottle gets

00:48:28 Speaker 2
Say twenty five cents or twenty five cents thirty five. That's actually what the plastic bottle does.

00:48:36 Speaker 6
So he says, initially, he gets what twenty bottles.

00:48:40 Speaker 2
We need different bottles. Glass bottles are too much.

00:48:47 Speaker 3
This here is fully refined. This is kind of here I'm trying to would we have different shops? Different waiting times like how do we want to do?

00:49:02 Speaker 2
We spoke about Rewe and Netto, for example, to say you cannot deposit in Netto.

00:49:10 Speaker 3
Let's make it simpler. Let's make them only get food from Doner, not from the shops. The shops are only for depositing the bottles.

00:49:28 Speaker 2
But maybe it's a good idea to separate the concerns. I mean, you also wait. It's kind of silly because if you go to Rewe, you wait for ten seconds to deposit bottles and then you wait again to buy food. It's kind of boring.

00:49:42 Speaker 3
Because we're making it a game on a board.

00:49:46 Speaker 6
We don't see the user needing a pop up if we click on this, there'll be two pop ups, one with bottle, one with food. Then we need to click so that will make it a bit more fun.

00:49:56 Speaker 2
But actually, I like the idea of separating them, so you only deposit here and eat here. It gives some clarity and simplicity.

00:50:04 Speaker 4
But it confuses customers because if it's a supermarket, you're supposed to buy as well. Maybe we can rename it to something different. It's kind of confusing mentally.

00:50:20 Speaker 3
But also drawing from real life, I usually go insert the bottles, get the money and then leave the shop. I never sold and bought something.

00:50:33 Speaker 4
But usually you get vouchers to buy.

00:50:35 Speaker 3
They get the vouchers. We were presented that their money here became thirty.

00:50:47 Speaker 2
That's a fair point. It's a fair point. It's a fair point. It's not very realistic, but. The.

00:50:56 Speaker 6
Only distinction between donor shop and is. The price which we can have discounted prices.

00:51:03 Speaker 2
The question is if we need it, right?

00:51:06 Speaker 4
Realistic, we can get a voucher to buy in Reven. In this case, you get more money if you take money instead of a voucher, and if you want to buy in donor, you get less money. So for this voucher, you can spend more money in Reven as otherwise you will get less money and can go to donor.

00:51:23 Speaker 2
But then why would you go to the donor at all?

00:51:27 Speaker 3
I am not arguing with the logic, but I am thinking of the game. How would we represent this?

00:51:35 Speaker 2
The buttons, as suggested, just like button deposit or buy.

00:51:41 Speaker 6
You click on it; it will show two pop-ups:

00:51:44 Speaker 2
Deposit or buy. If you click deposit, it shows vouchers or cash again.

00:51:55 Speaker 2
Could do it, and we could do that. The question is, do we need to do that? Because it's not realistic, but I like the simplicity of we only deposit here, we only eat here. I like the simplicity of the objects that you interact with. Let's maybe leave this exact decision for a bit later. We can just start with creating the main mechanics. And then if we decide because these buttons pop-ups, it's an additional step in any case. So let's just start with the deposit, and we can also say we don't want donors at all. We remove donors and we only have supermarkets. Or we separate, like we have different variants, but we can start working without the final decision. I'm missing the Brandenburger Tor.

00:52:42 Speaker 3
I think don't know how we are representing this in the whole theme of the scene.

00:52:53 Speaker 2
Theme of the scene

00:52:54 Speaker 3
And in some

00:52:56 Speaker 2
And in one of the corners, you have the actual thing like for it's this square. For Brandenburg Gate it's the tower itself. For Alex it's the tower. They don't do much functionally.

00:53:11 Speaker 6
The assets will be the landmark buildings and trees.

00:53:20 Speaker 6
Houses, kind of roads, little roads, NPC characters like people just walking around. They are not doing anything.

00:53:26 Speaker 2
If we have enough time, I think it would be cool to make it lively. Maybe they can ask or say something like, 'Oh, you're stinky' or 'Here's the bottle.' It can be fun, but not in the first iteration.

00:53:39 Speaker 4
Probably this is not branded? Branded booklets and another two right? Cold Busitor will have more beans.

00:53:46 Speaker 2
Uh more bins.

00:53:49 Speaker 4
And also for markets in the

00:53:51 Speaker 2
In the next iteration, We also can introduce uh PVP where other players are stealing your bottles and you have a whole competition. Okay.

00:54:03 Speaker 4
And regarding future ideas for shelters, maybe it's not a shelter like a house, but a box, like a bus shelter and you need to catch it as it's moving around.

00:54:17 Speaker 6
Maybe do we need Background music, noise. I mean

00:54:22 Speaker 2
It would be cool to have some. That was what I was trying to do when he started drawing. I was making sounds to kind of create an atmosphere.

00:54:32 Speaker 3
I like that. I wrote here different scenes: gameplay could be character sound effects.

00:54:39 Speaker 2
Text bubbles.

00:54:40 Speaker 3
On just a grid of pink grids. And then what we can add later or in parallel, we can have different scenes. We can have different character designs. Someone can handle the sound effects and the background music. Someone can design the text bubbles, not just how it works, but also what the person would say funny.

00:55:10 Speaker 6
Or some catchy slang.

00:55:14 Speaker 3
Actually I understood that this is the branded burger tour.

00:55:19 Speaker 2
Because I said it five times, and you were primed to understand it. I just draw as if on five. It might be a hidden little bottle near the.

00:55:39 Speaker 4
Okay, yeah.

00:55:40 Speaker 2
And maybe not. But maybe you can search this.

00:55:44 Speaker 4
It's always inside this book of beer that say 'yeah.'

00:55:50 Speaker 3
Going deeper into this. We were randomized the wait time.

00:56:01 Speaker 2
I would probably keep it static.

00:56:02 Speaker 3
And it's not visible in advance. It's also a surprise, like when they reach the shop only then they know the wait time.

00:56:13 Speaker 2
Maybe could change day to day.

00:56:18 Speaker 2
On a Friday night, it's a longer wait time. It probably has to have some threshold, like between two and twelve seconds.

00:56:27 Speaker 4
Maybe we even need waiting.

00:56:30 Speaker 2
Time for which purpose? To have some effect so that if you don't go back and forth with every bottle. Maybe we should allow going back and forth.

00:56:44 Speaker 4
And maybe during waiting time, we can show some animation.

00:56:48 Speaker 3
I think pragmatically, if we drop the wait time, we will drop this as well. It makes it simpler.

00:56:58 Speaker 2
We can make it later. Micro payments to reduce waiting time. We're gonna be rich! You're gonna be fucking rich!

00:57:11 Speaker 2
Fantastic.

00:57:15 Speaker 3
Is everything, is all the logic to the hearts defined? We said they might lose with this random possibility. Half a heart? But when would they get a new one?

00:57:32 Speaker 4
That's why I said maybe we need some medicine. We can buy it or find it on the beach.

00:57:38 Speaker 3
We previously said to be the donor.

00:57:41 Speaker 4
Let's say hospital. You have one hospital, you can write.

00:57:44 Speaker 3
I am also thinking pragmatically, we can drop this.

00:57:49 Speaker 4
Let's buy some medicine and if you have a lot of hearts, you better go for food. If you have only one heart, go to buy weed. They don't buy medicine.

00:58:02 Speaker 4
Maybe actually we're doing it for fun right?

00:58:06 Speaker 3
We want it to be funny.

00:58:07 Speaker 2
Then we smoke a joint, you get plus one more heart.

00:58:11 Speaker 3
I like that. I like that.

00:58:12 Speaker 2
And the sound effect, I'll just. No medicine! That's the sound effect. Puff.

00:58:19 Speaker 3
It's so funny, diagnosis and guys, I think they can start. Let's instead of making it realistic, make it funny.

00:58:31 Speaker 2
I wouldn't say weed store. It should be dealer.

00:58:34 Speaker 4
Well actually it should be in a park where people usually buy it.

00:58:38 Speaker 2
If CBD you can buy in a store, but THC.

00:58:42 Speaker 3
Maybe instead of this it could be another person. But that depends on the text bubbles to see that they are talking. So maybe we start with a store and then we turn it into

00:58:54 Speaker 2
just a point. Like you deposit some money. Hey dude, do you have something for me? Got something? Ten euro.

00:59:07 Speaker 2
And you get a heart, but you lose some time.

00:59:12 Speaker 4
So what to time as well.

00:59:13 Speaker 2
When you smoke up, minus ten seconds.

00:59:16 Speaker 3
Actually that's a good thing. How do these two interact with each other?

00:59:21 Speaker 2
First of all, three hundred seconds is too much for one round.

00:59:26 Speaker 3
Five minutes. we can lower it. But But if it's how let's say let's say it's one hundred.

00:59:34 Speaker 2
I would say you have to eat properly, which is let's say five or ten euros per day. I think maybe ten is also a little too high with twenty-five cent bottles.

00:59:46 Speaker 4
So you show here some kind of hunger level, to be full or so you're not hungry anymore. I think by the end of the day you're still hungry, you have instead. And this we can relate to time.

00:59:59 Speaker 3
I'm discussing this to say that it's not refined and it's adding complexity.

01:00:05 Speaker 3
We wanted the game to be fun. We don't care about making it more playable. I'm very inclined to make this all second thing, second marks.

01:00:22 Speaker 2
What? The hearts

01:00:25 Speaker 3
The timer. Like. No.

01:00:27 Speaker 2
But without the hearts and the timer, there is no game. There's no game mechanics.

01:00:31 Speaker 3
The game is The fun aspect is you walk around, you collect bottles, you exchange them, get money. And then when we build up the scenes.

01:00:41 Speaker 2
But you have to win and lose. Without it there is no game.

01:00:45 Speaker 3
When we build up the scenes, it makes it more relatable that this is the Berlin life. Seeing the Brandenburg Tower, sound effects, maybe text bubbles, it makes it more enjoyable than winning and losing.

01:01:01 Speaker 2
But without winning and losing there is no game. You cannot have a game if you cannot win and lose.

01:01:09 Speaker 3
Hundred percent this

01:01:10 Speaker 2
Hundred percent, no doubt. This is fluff. We can do without bubbles, we can do without sounds. If you think about Tetris itself at the beginning, it had none of that, but it had the game mechanics, it had an idea of winning and losing. If you don't have winning and losing, you don't have a game. In a game, you have to be able to win and lose. That's it. Otherwise, it's not a game.

01:01:31 Speaker 3
But we like this idea, the hobo, because of all the jokes we made, like the marketing director who lost his job. So making it more fun or funny. But how?

01:01:49 Speaker 3
I'm saying iteratively. I'm not saying remove it completely. But I'm saying not building it from the start.

01:01:57 Speaker 4
We need this final goal.

01:02:01 Speaker 2
You need to win or lose. Otherwise it's just not a game. If we decide not to make a game and say what would it be? If we just say it's going to be an interactive explorative experience kind of thing, then we could set the set design and sounds and make the experience itself. The music, the dialogues, the interactions. Something that people just enjoy. They don't have a goal in it. They say, explore Berlin as a hobo. And you have three locations and you have funny dialogues and some local shops. This could actually be interesting, but it's still a one time thing. It can be fun.

01:02:49 Speaker 3
It can be fun But for one time But.

01:02:51 Speaker 2
It's not a game. Let's make it a game. Let's lock this. The timer but if you don't.

01:03:01 Speaker 3
Do they lose a single or all

01:03:03 Speaker 2
Or I think single because if they lose all, they're just going to die and never.

01:03:11 Speaker 4
Is that the goal for every round? You need to eat some minimum amount of food as well as why we kind of also just spend all money for meat. Maybe create probably we can show some hundred level like this. It should be four hundred out of today.

01:03:29 Speaker 2
That's a good point.

01:03:30 Speaker 4
Otherwise, if you are still hungry, can you always have that card or one card? Probably even one heart. One heart, I think.

01:03:37 Speaker 3
So here plus one heart. Here plus any heart? What does this mean?

01:03:45 Speaker 2
No

01:03:46 Speaker 3
This is not just hunger level. It should decrease your hunger level. No decrease hunger level, we said, similar to this, making him lose a heart. We want something that makes.

01:03:57 Speaker 2
We shouldn't have too many mechanics. We shouldn't have too many.

01:04:01 Speaker 4
When you eat, you get extra life. But when you eat, you just eat. It's not hard.

01:04:11 Speaker 3
Then I would skip eating like how does it?

01:04:14 Speaker 4
That's why I suggested this kind of hunger level.

01:04:20 Speaker 3
And instead of what the hearts?

01:04:22 Speaker 4
No, not hearts.

01:04:24 Speaker 2
Like an additional thing.

01:04:25 Speaker 4
For example, energy. And at the beginning of the day, you should be full by the end of the day. If you are not full, you'll lose your part. So there is a connection.

01:04:38 Speaker 3
Here because these are three different goals that players try to chase. But this is for the whole game.

01:04:47 Speaker 4
This is for one round. We need to go for one round as well.

01:04:49 Speaker 3
This is also for the one round.

01:04:51 Speaker 4
These are two. That's why connect. So by the end of one time, it's over.

01:04:57 Speaker 2
To be cool. Uh, the timer is not a goal. Timer is a constraint.

01:05:02 Speaker 3
As a constraint. The user is putting their focus into collecting the most possible within the timer. They are watching the timer and what's left over here.

01:05:17 Speaker 2
Because what if we do it simpler? What if we say we don't have hearts and the only goal is to collect bottles? And if you collect a certain amount of bottles and you don't get stung enough times, then you win the round. Without buying food, without all those conversions. I think the right point you're making is that we are having too many goals, too many mechanics. And that was actually when I started talking about this stickiness. I also thought maybe it's too much because it stops being simple.

01:05:52 Speaker 2
Maybe we just collect bottles and that's it. To collect bottles, that's the purpose. You collect a hundred bottles in a day, you survive. You don't, you lose a heart.

01:06:05 Speaker 3
Are there some kind of games like Sonic or Minions, where you're just collecting coins and you reach the end of the level, and you either die or reach the end? Let's say your best score is six hundred. It's just personal best.

01:06:25 Speaker 2
But then we need personal best mechanics or some sort of level.

01:06:32 Speaker 3
It's a different game by time. There's an exit condition and at which we calculate your score.

01:06:42 Speaker 2
I think it's getting a little too complex.

01:06:49 Speaker 6
Change our views. Then these become irrelevant and they will later because see, if we even reach six hundred bottles, then you need to pause the user. Now you have reached six hundred bottles, go to the nearest supermarket and deposit it because that's the maximum. Then there is no I think purpose of money as well on this, if they are not buying anything. Should we build this in?

01:07:19 Speaker 3
Milestones. So for example, only build this logic and the card, the number of bottles. Then in parallel, someone else is building this.

01:07:31 Speaker 2
I mean, we do need to have fundamentals because otherwise you'll rebuild the whole thing. One thing is to build iteratively when you more or less have a goal, and then you just build different pieces, one by one, and you test them and see if they work together. But we need to understand for the entire iteration. Because iteration is not just.

01:07:54 Speaker 3
If we build this.

01:07:55 Speaker 2
What we want to do.

01:07:56 Speaker 3
And we need to build architecture and data flow as well. If we build this, I mean honestly, the grid, the movement and the interaction here and the data model. And we're just collecting a number. So this can continue on top of this. I agree it can't start entirely but it can continue on this. If our time ends, if they say we are presenting in ten minutes, we have already built a playable version.

01:08:25 Speaker 1
Okay. Um. Yeah,

01:08:31 Speaker 6
Let's start with the portal part, and then we can do the money and I think if people could do it this quickly, if you have the base ready, we'll have more motivation to add.

01:08:47 Speaker 6
The part, let's say this is iteration one.

01:08:50 Speaker 3
It cannot be parallelized, but then we can build this. We can build these in parallel, like the rest of the logic. These can all be parallelized once we built this.

01:09:07 Speaker 2
Not really because i mean data model should also include. Do we have the money? Do we have the hearts? Do we have the timer?

01:09:16 Speaker 4
But it's easier to implement it in the beginning because artificial attention will do it. And creating the whole model in the beginning is faster than iterating.

01:09:29 Speaker 3
But if LLM can do all, but if we give it all of that to build, it might take an hour. But if we start with this and then we parallelize these, we take fifteen minutes each.

01:09:45 Speaker 4
Ten minutes max.

01:09:48 Speaker 2
It's ten minutes. It's just going to be burning tokens for half an hour easily. Depending on which model you take.

01:10:05 Speaker 2
So it can run for a whole day. It's not a ten minute thing.

01:10:15 Speaker 4
By another person. Is this one person, is this another people?

01:10:21 Speaker 2
Should we vote? Partly.

01:10:24 Speaker 3
We can vote if we read this, then this or read it all together.

01:10:29 Speaker 2
I just don't I'm not sure we need all the elements like the We could go without we and the donor (no correction needed, but context suggests "donor" might be a mishearing; however, no clear phonetic match to a standard term, so leave unchanged). We could just have one shop and you deposit bottles there and you buy food there. You have to reach.

01:10:45 Speaker 3
If we do that, maybe your score is not how many bottles, but how many euros you collected. How many what? Yours you collected. Like here you're collecting bottles, here you're collecting euros. How much money?

01:10:58 Speaker 2
Money. Euros.

01:11:00 Speaker 3
The final score for the round could be either bottles or euros. Both are fine.

01:11:07 Speaker 2
I mean if you call I mean.

01:11:14 Speaker 2
How do you in that? In that case, you cannot lose.

01:11:18 Speaker 3
You will play to get the highest score. Then we start adding those mechanics, like how you can lose and how you can win.

01:11:28 Speaker 2
But no, I mean then we have to change the whole game because then you will always survive seven days.

01:11:36 Speaker 3
Changing how you win or how you lose. The whole game.

01:11:43 Speaker 2
Aesthetics. But the game mechanics is the most important thing.

01:11:45 Speaker 6
I think the first idea of having a heart makes sense. We are four of us, one of us can take that part of game mechanics to get it out. Either we can have a bar or we can consider this as a hundred percent. And as time goes, we can keep decreasing it. He buys a food. We increase it by some amount. And then again, with time it keeps decreasing. And definitely, when it reaches zero, your heart is gone. So that's one mechanic any one person can take. When we build it, that's the question. I think let's start simple. Let's not consider

01:12:27 Speaker 2
I think we need two things. We need to have a base repository with the canvas.

01:12:36 Speaker 2
Maybe just.

01:12:36 Speaker 3
Repository also the specs.

01:12:38 Speaker 2
With the GUI and control elements. When we have that, then I think we can clone it and then we can have branches and build these pieces separately. I think a base repository with the web canvas, with the GUI and with walking up, down, back and forth, and with a grid. Basically, the grid, the canvas, the grid. The person and the top bar, and what belongs there, that's a different story.

01:13:08 Speaker 4
Always bins and to have the items or manage items. It might be a placeholder right now, but it should exist and you can set it later on.

01:13:18 Speaker 2
I would say just the item, not whether it's a river and not whether it's a bin, just an item. An item can span multiple grid. The grid is good because we can have an item that spans like four by two, an item that is one, just a placeholder for item with the configuration, how big it is, with the name identity of what it is. But we define that all later. Like in the first iteration, it's just the architecture. It's just these sixty four. Let's say sixty one. It doesn't have to be a square actually because it's a vertical thing. So whatever sixty four vertically and hundred twenty horizontally.

01:14:02 Speaker 2
Placeholder for the top bar, the little placeholder one by one square, basically without any assets for the character. Movement dynamics and placeholder for items whether it's a river, whether it's a bin, whether it's a donor. We can decide that later, and everybody will be able to put their own skins or assets on it and decide the sizes of it. And that's what we need, and mechanics of placing those things that you cannot walk on another item. The character cannot walk over. But do you use state machine in these cases?

01:14:48 Speaker 4
So every cell of the grid has a state?

01:14:52 Speaker 2
Can we use without.

01:14:56 Speaker 4
Good question.

01:14:56 Speaker 2
We can still also.

01:14:59 Speaker 3
Probably, blocks can also be added later. You can just make it either you walk on something or you discover something. You can add the blocks later.

01:15:12 Speaker 2
But those are technically states

01:15:14 Speaker 3
Instead of the grid being zero, it becomes zero block whatever.

01:15:23 Speaker 6
So then I think we can go with

01:15:31 Speaker 6
So we are.

01:15:31 Speaker 3
Doing this all of us together.

01:15:35 Speaker 2
Specs and tech.

01:15:38 Speaker 3
Tech part is mainly because of how we render this grid and the character.

01:15:46 Speaker 4
Maybe students have lunch tomorrow? And also, which language to use?

01:15:52 Speaker 3
What language? It's for web, so the front end. TypeScript.

01:16:00 Speaker 3
We don't have backends.

01:16:04 Speaker 2
Not immediately.

01:16:08 Speaker 3
Old frontends. That's cool. How.

01:16:12 Speaker 2
About SSO? This is a joke. We're not planning to do that.

01:16:22 Speaker 4
So we can create a prompt. Right now, and we when we have lunch, this prompt can start already creating all the things. Before the prompt, we need to this.

01:16:31 Speaker 2
That's what I'm doing with the transcription. I'll transcribe it and throw it into Codex and make a spec. And I will create an empty repository with a spec. And well, I can also run Codex on it if I can log in. If somebody is already logged in, maybe you should start doing it and from the spec extract, basically tell Codex to extract the first task. Hey, architecture canvas items. That's what I would do, then I would launch it.

01:17:02 Speaker 6
And then we go eat.

01:17:05 Speaker 2
Most of the spec is here. That's why I turned it on. Most of the spec is recorded, and then we can take a photo of this and give it to anybody designer. Think so. I don't think so, but we can draw maybe a smaller version. I can draw my Japanese crossword. I can because it's a grid. It's a grid. Look at this. Where is it? We can use one of bigger ones, maybe this one as our template for the grid. Just draw here.

01:17:48 Speaker 2
Maybe it's too big. I think that's a little better because this one is speaking.

01:17:57 Speaker 3
We can split the work between us. Someone can handle the grid placement, and someone can work on the rendering of whatever grid is.

01:18:06 Speaker 2
I'm talking about the very first step, the basic architecture. I don't know if you need to draw it.

01:18:12 Speaker 3
Maybe in the spec you don't need to tell it, the grid looks like this, you can tell it, the cell could be this or that, and that can have status. The actual grid is not a spec at all.

01:18:25 Speaker 6
Why not? Let's define the problem statement and architecture data flow.

01:18:31 Speaker 2
I mean honestly this is like this is. I mean honestly yeah.

01:18:39 Speaker 6
But.

01:18:42 Speaker 2
I think that's all. We should do some of it. How do you think about this, guys? Let's get our laptops to a table where we can sit. Let me transcribe the thing and do the dancing with the spec and the repo creation. In the meantime, you finalize the problem statement as you guys see it. Write it down somewhere digitally. After I share the repo, we include this and start building up the repository.

01:19:16 Speaker 2
Must have nice have. That's I think after we have the spec, acceptance criteria. I want to have it playable. Can be simple and maybe not great looking, but actually want to run with the Hobo and be able to play.

01:19:33 Speaker 6
I think once you get the chance you can distribute this.

01:19:36 Speaker 2
But let's do the spec and the problem statement first.

01:19:45 Speaker 2
Fucking hell. Oh shit. I hope not. I should watch my tech.

01:20:23 Speaker 2
And we need more. Do they have Steckdosen?

01:20:54 Speaker 1
I like.

01:21:01 Speaker 5
This one.
