---
layout: post
title: "Beware the Comment Siren Song"
date: 2014-08-20 08:53:27 -0400
comments: true
categories:
- Ruby
- Programming
---

Developers love comments! They love documenting their code, leaving little reminders that explain some
tricky section of code, or leaving a reminder for their later self. Everyone who writes these comments thinks
that they're making a [pareto improvement](http://en.wikipedia.org/wiki/Pareto_efficiency) to the codebase, when,
in fact, it's quite the opposite. Comments are especially dangerous because there are many situations where it
*seems* like a comment will help, but beware the siren's call!

Comments decay. They aren't compiled, and they'll never get executed at runtime. If they become out of date or
incorrect, no test is going to fail and no user is going to complain to get you to fix them.
Programmers work around them out of fear that "somebody might need this comment or it might provide some value
in the future", pushing them along far after they're useful. (if you can even argue that they were useful in
the first place)

To be clear, I don't have a problem with all comments. If, for example, you're writing a public API for
a library that's getting exported to the world, or to a bunch of developers at your company, it may be
easiest to maintain the documentation for that API in code comments. In other words, if you're making a
conscious decision to document a library thoroughly, you might find that it's most convenient to keep that
documentation close to the code. In that case, you should have some kind of process around making sure that
the documentation remains up to date when you make breaking API changes. You should also be able to easily
generate structured documentation from those code comments.  ([RDoc](http://rdoc.sourceforge.net/) for Ruby
is one simple example)

Enough bloviating, let's check out some examples! Here are some concrete uses of comments that I've seen a lot,
and how they can be easily avoided.

### Reminder / TODO

Reminders belong somewhere besides your source code. Writing `TODO` or `FIXME` somewhere in the codebase creates
a bit of a [bystander effect](http://en.wikipedia.org/wiki/Bystander_effect). It seems like the intent of the
TODO is that that "someone will surely see this code and proactively delete it", but the reality is that will
never happen. Every time someone goes into that section of the code, they're in there for some other purpose
and they're going to ignore your TODO. This is especially true on bigger teams.

Example:

```ruby
require 'mylibrary/railtie' if defined?(Rails) # TODO: older rails support!
```

Realistically, when is that TODO every going to get done? Practical suggestion: use the wonderful
[doby](https://github.com/andyw8/do_by) library, or roll your own expiring todos.

```ruby
TODO 'older rails support!', '2014-09-01'
require 'mylibrary/railtie' if defined?(Rails)
```

This method sets a specific due date for the `TODO`, and, unlike a regular comment, it actually gets executed
and blows up if you haven't removed it before the due date! (buyer beware: you probably only want this behavior
in dev!)

### Explaining why code is doing something

Another tempting moment when you want to write a comment is to explain some code that isn't 100% intuitive. Let's
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
false. So, we have to return nil instead. So how can we explain this without a comment? Why not just write a
helpful method which explains what's going on, and can be easily reused?

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

### Explaining some counterintuitive change

Belongs in the git history, which should be easily accessible with tooling! Also goes away automatically
once the code is changed / deleted.

### Old code you want to keep around

This is by far the worst commenting infraction of them all! You might see a comment like:

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
code. Let's say you want to resurrect a method called `reslug_all_tag_pages`. Just use:

```sh
$ git log -Sreslug_all_tag_pages
```

and that will find all commits that added or deleted a line including that string. Simple!

### Automatically generated comments

These are the worst! It's less common in the world of dynamic languages, but the most popular IDEs for compiled
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
