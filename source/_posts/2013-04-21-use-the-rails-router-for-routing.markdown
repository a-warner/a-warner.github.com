---
layout: post
title: "Use the Rails Router for Routing!"
date: 2013-04-21 17:41
comments: true
categories:
- Rails
- Ruby
---

This is a quick one, and the title says most of it.  Basically, you should never have code like this in
your app:

```ruby some_controller.rb
class SomeController < ApplicationController
  def some_action
    if something_about_the_url?
      do_something
      render :template => :foo
    else
      do_something_else
      render :template => :baz
    end
  end
end
```
<!-- more -->

The whole point of the router is to handle stuff about the url!  Instead, move whatever the logic inside
`something_about_the_url?` does upstream to the router layer.  For example, say you want to display a different
home page for www.mysite.com and blog.mysite.com.  This can be accomplished very easily using the router:

```ruby routes.rb
constraints subdomain: 'blog' do
  root to: 'blog#home'
end

root to: 'static#home'
```

Note that, in this specific case, you must have the subdomain route above the `root` route, otherwise the router
will match the route to `static#home` before it gets to the subdomain constraint.  Remember that the router
checks routes in order.  All set!
