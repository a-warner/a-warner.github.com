---
layout: post
title: "Choosing a new theme"
date: 2014-08-13 23:25:46 -0400
comments: true
categories:
- Ruby
- Octopress
- Blogging
---

About a week ago I finally decided that I wanted to start blogging again. I love talking about programming, but I often find it
difficult to motivate myself to write a blog post about it. I sat down to write a post, and sure enough, I couldn't think of anything
to blog about. So instead I procrastinated by thinking about all of the things I wanted to do to make my blog better.

<!-- more -->

The most obvious problem was that I was still using the default [Octopress](https://github.com/imathis/octopress) theme.
It has a lot of nice qualities: it's easy to navigate around, easy to read, and it's responsive! Unfortunately,
using the default theme meant that my site also looked exactly like
[everyone else's](https://github.com/imathis/octopress/wiki/Octopress-Sites).

Now Octopress is also great because it's extremely easy for anyone to make a theme. In fact, a
[bunch of people](https://github.com/imathis/octopress/wiki/3rd-Party-Octopress-Themes) have already done exactly that. Looking at the
list of themes, though, I realized that it was difficult to tell which ones were "the good ones." Normally when I have a huge list of
products that I want to comb through, I'm on a website where I can easily sort by some metadata about the product. (e.g. Amazon)
My preferred sort is always by popularity: I basically trust the wisdom of the crowd. On Amazon, for example, I'm much more interested
in the product with the most reviews than I am in the product with the best average review. Unfortunately, GitHub tables have no such
convenient sorting options!

Luckily, I'm a programmer, and, wanting to procrastinate more, I decided that I wanted to write a quick script to sort projects by
number of stars. As it turns out, it's pretty simple to use [Nokogiri](http://nokogiri.org/) and [Octokit](https://github.com/octokit/octokit.rb) to get the information I want:

{% gist 60afe3ffdd0872719247 %}

This script simply:

* scrapes the [themes page](https://github.com/imathis/octopress/wiki/3rd-Party-Octopress-Themes)
* parses it with Nokogiri
* finds the table with the themes
* selects the link from the first column of each row, which is the link to the theme repository on GitHub
* extracts the owner and repo name using a "simple" regular expression
* maps owner/repo to number of stars
* prints a sorted list of repo links and stars

and voila, we have an Amazon-like sort by popular-type situation. (check out the results in the [gist comments](https://gist.github.com/a-warner/60afe3ffdd0872719247))

After checking out the popular themes, I decided, contrary to my usual shopping strategy, that I wasn't in love with any of them.
I was looking for something simple, single-column, and easy to read. I ended up settling on
[whiterspace](https://github.com/mjhea0/whiterspace), which, even though it only had 45 stars, was exactly what I was looking for.

So, while I didn't end up choosing the most popular theme, it was still useful to be able to look at a mapping of themes to popularity.
In the end, whiterspace got one more star, and I got a cleaner, more distinct-looking blog. Oh, and in doing all of this work, I ended up with a
somewhat interesting topic to blog about (I hope!), accomplishing my original goal in a somewhat roundabout way. Win win win!
