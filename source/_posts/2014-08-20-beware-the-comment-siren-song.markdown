---
layout: post
title: "Beware the Comment Siren Song"
date: 2014-08-20 08:53:27 -0400
comments: true
categories:
- Ruby
- Programming
---

Developers love comments! They love documenting their code, leaving little comment breadcrumbs that explain some
tricky section of code, or leaving a reminder for their later self. Everyone who writes a comment thinks
that they're making a [pareto improvement](http://en.wikipedia.org/wiki/Pareto_efficiency) to the codebase, when,
in fact, it's quite the opposite. Comments are especially dangerous because there are many situations where it
*seems* like a comment will help, but beware the siren's call!

Comments decay. They aren't compiled, and they'll never get executed at runtime. If they become out of date or
incorrect, no test is going to fail and no user is going to complain.
Programmers work around them out of fear that "somebody might need this comment or it might provide some value
in the future", pushing them along far after they're useful. (if you can even argue that they were useful in
the first place)

I hate reading articles that make abstract arguments, so, enough bloviating, let's check out some examples.
Here are some concrete uses of comments that I've seen a lot, and how they can be easily avoided.

### Explaining some code

You might want to write a comment to explain some code that isn't 100% intuitive. Let's
take a practical example from the [Genius](http://genius.com) codebase:

```ruby
class Artist < ActiveRecord::Base
  before_save :set_canonical_name_changed

  private

  def set_canonical_name_changed
    self.canonical_name_changed = !!canonical_name.try(:name_changed?)
    nil # return nil because if canonical_name is unchanged, it'll return false, which halts save!
  end
end
```

So that comment helpfully explains that `ActiveRecord` will halt saving a model if one of the callbacks returns
`false`. So, we have to return nil instead. Whenever you're tempted to comment your code to explain what's going on,
the code isn't clear enough. Your goal should be to make the code readable on its own.
So how can we make this section clearer without a comment? Why not just write a helpful method which explains
what's going on, and can be easily reused?

```ruby
ActiveRecord::Base.class_eval do
  def without_halting_save
    yield
    nil
  end
end

class Artist < ActiveRecord::Base
  before_save :set_canonical_name_changed

  private

  def set_canonical_name_changed
    without_halting_save do
      self.canonical_name_changed = !!canonical_name.try(:name_changed?)
    end
  end
end
```

Now we have the same amount of information, and a reusable method that explains its intent. Plus, now if
`ActiveRecord` changes its behavior, and returning nil suddenly starts halting save, we can change this method
and [lift all boats](http://en.wikipedia.org/wiki/A_rising_tide_lifts_all_boats).

### Reminder / TODO

Writing `TODO` or `FIXME` somewhere in the codebase creates
a bit of a [bystander effect](http://en.wikipedia.org/wiki/Bystander_effect). It seems like the intent of the
TODO is that that "someone will surely see this code and proactively delete it", but in reality that will
never happen. Every time someone goes into that section of the code, they're in there for some other purpose
and they're going to ignore your TODO. This is especially true on bigger teams.

Example:

```ruby
require 'mylibrary/railtie' if defined?(Rails) # TODO: older rails support!
```

Realistically, when is that TODO ever going to get done? A better solution would be to use some project management
tool to prioritize different features or fixes. If you have to keep your `TODO`s in the code, use the
[doby](https://github.com/andyw8/do_by) library, or roll your own expiring todos.

```ruby
TODO 'older rails support!', '2014-09-01'
require 'mylibrary/railtie' if defined?(Rails)
```

This method sets a specific due date for the `TODO`, and, unlike a regular comment, it actually gets executed
and blows up if you haven't removed it before the due date. (buyer beware: you probably only want this behavior
in dev)

### Explaining some performance hack

Most of the time you can write readable code and not worry about performance, but sometimes performance
actually matters. When you have to write a performance hack, you might have an urge to write a comment explaining
why. The instinct to want to document your performance hack is the right one, but a comment is the wrong place.
Why? Because the hacky code might get modified, removed, or moved somewhere else, and the person who does that has to
remember to update the comment too. The comment will never "break" and force you to fix it if the behavior of the
hack changes, it will just stick around to confuse future programmers.

The right place to document hacks is a commit message. A commit message is easily accessible
(with the right tooling) to programmers wanting to edit the code, but it doesn't clog up the code and make
it harder to read. If your source control history isn't easily accessible to programmers, then you need
better tooling. I use [fugitive.vim](https://github.com/tpope/vim-fugitive) to easily `git blame` any line that
I want to know more about. In concert with
[git getpull](http://www.leastastonished.com/blog/2014/03/06/git-getpull-quickly-find-the-pull-request-that-merged-your-commit-to-master/),
I'm never more that a few quick commands away from figuring out exactly why a line was written in a certain way.
Commit messages will never become out of date, because if the line that they're modifying gets deleted or modified, the commit message gets automatically "removed" from your immediate view in `git blame`.

When I'm writing a performance hack, I typically wrap it in a method explaining that it's a hack, and then write
a more detailed explanation in the commit message. For example, let's say I've written some fast array compare
based on some specific knowledge of a data structure:

```ruby

def some_complex_calculation_method(input_array)
  if compare_input_with_stored_values_performance_hack(self.stored_array, input_array)
    # ... something ...
  end
end

def compare_input_with_stored_values_performance_hack(stored_array, input_array)
  # here be dragons
end

```

All I need to do is to give the reader some clue that it's a performance hack, and then they can read more in
the commit message if they want.

### Old code you "want to keep around" in case you need it

This is by far the worst commenting infraction! You might see a comment like:

```ruby
# def reslug_all_tag_pages
#   Tag.find_each { |t| t.regenerate_slug! }
# end

def something_else_thats_actually_being_used
  ...
end
```

"Keeping around old code you might want to use later" is *exactly* what source control is. If you want
to resurrect some old code, you can do so easily with git as long as you can remember some part of the
code. Let's say you want to resurrect this `reslug_all_tag_pages` method. Just use:

```sh
$ git log -Sreslug_all_tag_pages
```

and that will find all commits that added or deleted a line including that string. Simple!

### Automatically generated comments

It's less common in the world of dynamic languages, but the most popular IDEs for compiled
languages tend to pepper the codebase with these useless automatically generated strings. They generate these
comments to remind programmers to document their APIs, but I've frequently seen developers commit
the automatically generated documentation on a method or class without modification. Some examples:

```java
public class MyList<E> extends ArrayList<E> {

  private int myVar;

  /**
   * @return the myVar
   */
  public int getMyVar() {
    return myVar;
  }

  /**
   * @param myVar the myVar to set
   */
  public void setMyVar(int myVar) {
    this.myVar = myVar;
  }

  /* (non-Javadoc)
   * @see java.util.ArrayList#addAll(java.util.Collection)
   */
  @Override
  public boolean addAll(Collection<? extends E> collection) {
    // something
  }

}
```

The generated comments do nothing but clutter up the code, making it more difficult for the reader to scroll
through the class and figure out what the code is doing.


### Is there ever a reason to write a comment?

To be clear, I don't have a problem with all comments. If, for example, you're writing a public API for
a library that's getting exported to the world, or to a bunch of developers at your company, it may be
easiest to maintain the documentation for that API in code comments. In other words, if you're making a
conscious decision to document a library thoroughly, you might find that it's most convenient to keep that
documentation close to the code. In that case, you should have some kind of process around making sure that
the documentation remains up to date when you make breaking API changes. You should also be able to easily
generate structured documentation from those code comments.  ([RDoc](http://rdoc.sourceforge.net/) for Ruby
is one simple example)

### Leave 'em out

So now that I've covered all of these examples, you don't have any excuse to write comments. Give these
methods a try, and I promise you'll have a cleaner codebase that's easier to maintain. Is there a good reason
to write a comment that I've missed? Let me know in the comments!
