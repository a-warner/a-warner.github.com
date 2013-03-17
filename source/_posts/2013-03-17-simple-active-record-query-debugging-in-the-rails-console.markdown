---
layout: post
title: "Simple Active Record Query Debugging in the Rails Console"
date: 2013-03-17 18:22
comments: true
categories:
- Rails
- Ruby
- Active Record
- Debugging
---

Stop me if this sounds familiar.  You're tooling around in the Rails console, testing out some new code you're working on (or debugging some slow/broken code), and you see a ton of repeat queries.

I have this experience frequently; usually I can figure out what's going on, but sometimes it can be quite tricky to track down the source of extra queries.  Whenever I want to figure out where a method is getting called from, one easy and lazy solution is to add a debugger statement in that code.  But where the heck do I add a debugger for sql statements?

It turns out that Active Record has a fairly unified choke-point for query execution on a per-model basis - `#find_by_sql`.  So, now that we know the method, what's the best way to add the debugger statement?  Well, we *could* just open up the gem code, but then we have to restart our console, and we run the risk of forgetting to remove the statement or otherwise screwing up the gem code in some way that's difficult to track down.  We could monkey patch the method, but even that sounds onerous, especially if we want the method to be usable again without hitting that debugger statement later in our session.

Enter a relatively short addition to your `.irbrc` or `.pryrc`!  Simply add the following method:

```ruby
def add_debugger(clazz, method)
  debugger_method = binding.respond_to?(:pry) ? 'binding.pry' : 'debugger'

  unless clazz.method_defined? "#{method}_with_debugger"
    clazz.class_eval <<-CODE, __FILE__, __LINE__ + 1
      def #{method}_with_debugger(*args, &block)
        #{debugger_method}
        #{method}_without_debugger(*args, &block)
      end
      alias_method_chain :#{method}, :debugger
    CODE
  end
end
```

Note that my debugger preference is `pry`, if it's available.  You can of course adjust the above code per your preference.  Now we can simply run:

```ruby
add_debugger MyModel.singleton_class, :find_by_sql
```

Running through our problem code again, you should find yourself in the debugger for any queries on `MyModel`.  Once in the debugger, simply inspect `caller` to figure out what pesky bit of code is generating all of the extra queries.

This is great, but it would incomplete if we had to restart the server in order to remove the debugger statement!  The following snippet should do the trick:

```ruby
def remove_debugger(clazz, method)
  return unless clazz.method_defined? "#{method}_with_debugger"

  clazz.class_eval do
    alias_method method, "#{method}_without_debugger"
    undef_method "#{method}_with_debugger"
    undef_method "#{method}_without_debugger"
  end
end
```

Just run `remove_debugger MyModel.singleton_class, :find_by_sql`, and you're back to regular development.

Now that you've got this method, adding debugging statements to your own code or 3rd party code is a breeze!

Check out my [.railsrc](https://github.com/a-warner/dotfiles/blob/master/.railsrc) for more little one-off development helper methods.

Is there an easier way to do this with pry?  Is there a gem that just does this and makes my silly code obsolete?  Let me know in the comments!
