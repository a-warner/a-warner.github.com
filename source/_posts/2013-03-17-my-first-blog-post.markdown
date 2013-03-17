---
layout: post
title: "My first blog post"
date: 2013-03-17 18:07
comments: true
categories: 
---

This is my first blog post! I setup up my blog using [Octopress](http://octopress.org/), which was incredibly easy.  They've got some great guides on their site, but just to give you a sense of exactly how easy it is, I simply:

* Created a repository on github named a-warner.github.com - the standard naming conventions that [Github Pages](http://pages.github.com/) expects if I want a-warner.github.com to resolve to this blog
* Cloned Octopress via `git clone git://github.com/imathis/octopress.git a-warner.github.com`, ran `bundle`
* Next step was to run `rake setup_github_pages`
* Then it's as simple as `rake generate` and `rake deploy`!
* Creating this blog post just involved running `rake new_post["My first blog post"]`

The writing process is extremely simple - just run `rake preview` until it looks right, and then `rake deploy` after committing your changes.

Not that I should be surprised, but using Octopress is really a breeze, and I highly recommend it to anybody looking to crank out a quick blog with minimal setup and maintenance.
