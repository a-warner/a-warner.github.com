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

Belongs somewhere besides source control. Especially for big teams, distributed responsibility
really means tragedy of the commons / bystander apathy.

### Explaining why code is doing something

Quick example of activerecord callback halting

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
