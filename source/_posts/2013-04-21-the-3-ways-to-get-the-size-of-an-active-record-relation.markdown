---
layout: post
title: "The 3 Ways to Get the Size of an Active Record Relation"
date: 2013-04-21 18:14
comments: true
categories:
- Ruby
- Rails
- Active Record
---

If you're reading this and your first thought is, "there are 3 ways to get the size of a relation?", then
you've come to the right place! Basically, given a relation like `Post.all` or `User.first.posts`, when you
want to know the size, you've got 3 choices: `size`, `length`, and `count`.  At first glance, it seems like these
might do the same thing, right?  Not so!  There are some key differences between them.

<!-- more -->

TL;DR - use `size`, it usually "Does the Right Thing"

First off, some background: both `Post.all` and `User.first.posts` are instances of `ActiveRecord::Relation`,
a very sneaky and
powerful class which manages lazy loading of records from the database. (full disclosure, `User.first.posts` is
actually an instance of `ActiveRecord::Associations::CollectionProxy`, but the difference between the two isn't
really relevant to this article).  It makes a best effort to filter, and
order records until the last possible minute when you actually ask for something concrete.  It's that lazy loading
which allows you to write code like `Post.where(featured: true).order(created_at: :desc).paginate(page: 1)`, which
will generate only one query for the first page of posts.  If you want to get the size of a Relation, there are
3 different ways to ask for it:

### length
The simplest of the three methods, `length` is simply delegated to `to_a` on the collection; in other words, calling
length is equivalent to calling `Post.all.to_a.length`.  It will query for ALL records, initialize ruby objects for
all of them, and then get the size of the array.  Probably not what you want if you just want to display the count
of the Posts on your blog!

### count
Does a sql `count(*)` query for the count of the records in the database.  You probably want to use this method
if you only ever need the count of the records in the association for whatever you're doing.  In the example above,
just displaying a count on the page is a perfect use case for `count`.

### size
Size makes a best effort attempt to "Do The Right Thing" based on the current state of the collection.  Here is the
actual source for size:

From [ActiveRecord::Relation](https://github.com/rails/rails/blob/master/activerecord/lib/active_record/relation.rb#L205):
```ruby lib/active_record/relation.rb
  # Returns size of the records.
  def size
    loaded? ? @records.length : count
  end
```

Great comment by the way, I never would have known what `size` did without it.

Basically, size is a heuristic switch between `length` and `count`.  If the collection is loaded, it just
gets the length of the loaded array, otherwise it will hit the database with a query.  As pointed out in a
[much more informative comment which is for some reason in the CollectionProxy object instead](https://github.com/rails/rails/blob/master/activerecord/lib/active_record/associations/collection_proxy.rb#L677),
you'll end up with an extra query if you call `size` and then actually need the elements of the collection later.

In a lot of cases the differences are completely irrelevant, but, for my money, `size` is the best of the 3 options.
It does the best job of not leaking details about what's going on under the hood in terms of lazy loading in Active
Record.
