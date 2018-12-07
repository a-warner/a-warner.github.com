---
layout: post
title: "Faster and simpler with the command line: deep-comparing two 5GB JSON files 3X faster by ditching the code"
date: 2018-12-07 07:42:27 -0500
comments: true
categories: 
---

_This post also appeared on [the Genius Engineering blog](https://genius.engineering/faster-and-simpler-with-the-command-line-deep-comparing-two-5gb-json-files-3x-faster-by-ditching-the-code/)._

As part of our [recently announced deal with Apple Music](https://genius.com/a/genius-gets-smart-with-apple-music), you can now view Genius lyrics for your favorite music within the Apple Music app.

We deliver our lyrics to Apple via a nightly export of newline-delimited JSON objects. With millions of songs in our catalog, these dumps can easily get as big as 5 GB. It’s not quite “big data”, but it’s also not something you can easily open in vim.

Our first iteration of the code that generated these nightly exports was slow and failure-prone. So, we recently did a ground up rewrite focused on speed and reliability, which yielded significant improvements on both axes—stay tuned for a future blog post on that subject. But other than spot-checking with small data sets, how could we make sure that the new export process wasn’t introducing regressions? We decided to run both export processes concurrently and compare the generated exports from each method to make sure the new version was a comprehensive replacement.

<!-- more -->

What’s the best way to compare these two 5GB files? A good first check is whether the new and old exports have the same number of lines; we can do this on the command line by dividing `wc -l` (line count) of the old export by `wc -l` of the new export using `bc`. If you haven’t seen `bc` before, don't worry: I hadn't either! It’s a tool to do simple arithmetic in the console.

```
$ echo "scale=3; $(wc -l < old_export.json) / $(wc -l < new_export.json)" | bc
.999
```

Ok great! The old export has 99.9% of the line count of the new export, meaning the new version actually has _more_ lines than the old export, so off to a good start.

Next, we can use `diff` to get the percentage of lines that are different between the new and old export. We'll use the `--side-by-side` and `--suppress-common-lines` flags so that we can pipe the output from `diff` directly to `wc` to get a count of total lines that differ between the two exports.

```
$ echo "scale=3; $(diff --side-by-side --suppress-common-lines old_export.json new_export.json | wc -l) / $(wc -l < new_export.json)" | bc
1.000
```

OOPS! Our diff is showing 100% of the lines differing.. either we seriously screwed up with this new export or our diff methodology is flawed.

Let's take a look at how these objects are structured (payload slightly modified for simplicity):

```
$ head -n2 old_export.json
{"genius_id":1,"title":"Killa Cam","artist":"Cam’ron","featured_artists":["Opera Steve"],"producers":["The Heatmakerz"],"url":"https://genius.com/Camron-killa-cam-lyrics","lyrics":"..."}
{"genius_id":3,"title":"Can I Live","artist":"JAY-Z","featured_artists":[],"producers":["Irv Gotti"], "url":"https://genius.com/Jay-z-can-i-live-lyrics","lyrics":"..."}
```

Fairly standard newline-delimited JSON. Let's look at the new export:

```
$ head -n2 new_export.json
{"url": "https://genius.com/Lil-wayne-fly-out-lyrics", "title": "Fly Out", "artist": "Lil Wayne", "lyrics": "...", "genius_id": 23, "producers": ["Marques Houston", "T-Mix"], "featured_artists": []}
{"url": "https://genius.com/Wu-tang-clan-cream-lyrics", "title": "C.R.E.A.M.", "artist": "Wu-Tang Clan", "lyrics": "...", "genius_id": 28, "producers": ["RZA"],"featured_artists": []}
```

Yikes, it appears that not only does the new export methodology not order songs in the same way, it doesn't have the same order of keys within each JSON object. This means that even if the actual JSON content of the files was 100% the same, it would look 100% different with our naive `diff` strategy.

### Enter `jq`

My first thought was to write a ruby script to parse and compare the two exports, but after spending a little time coding something up I had a program that was starting to get fairly complicated, didn't work correctly, *and* was too slow—my first cut took well over an hour. Then I thought: is this one of those situations where a simple series of shell commands can replace a complex purpose-built script?

Enter `jq`, [a powerful command-line tool for processing JSON objects](https://stedolan.github.io/jq/). Note: `jq` is not related to jQuery, but its name does make googling for examples a little tricky! Up until this point I had mostly used `jq` for pretty-printing JSON, a feature it is quite good at. For example, you can do:

```
$ curl -s https://api.cdnjs.com/libraries/jquery | jq
```

And see a nice pretty-printed version of the CDNJS response for jQuery.

`jq` also allows you to dig out specific fields from some JSON, e.g. going back to our exports, to get the list of ids from each export:

```
$ head -n2 old_export.json | jq '.genius_id'
1
3
$ head -n2 new_export.json | jq '.genius_id'
23
28
```

That's pretty much all I had used `jq` for before looking through these exports. But it turns out that `jq` is incredibly powerful as a tool for processing JSON (check out [the `jq` cookbook](https://github.com/stedolan/jq/wiki/Cookbook) to see some of the neat things that are possible). You can run entire programs, or “filters” as `jq` calls them (“filter” because it takes an input and produces an output), to iterate over, modify, and transform JSON objects.

How can we use it to solve the problem at hand, diffing these two large JSON files?

Well first we need to sort these files so that tools like `diff` can easily compare them. But we can't just use `sort`; we need to sort them by the value of the `genius_id`s in their payload.

It turns out this is quite easy with `jq`. To sort the exports by `genius_id` we can run:

```
$ cat old_export.json | jq -csMS 'sort_by(.genius_id)[]' > sorted_old_export.json
$ cat new_export.json | jq -csMS 'sort_by(.genius_id)[]' > sorted_new_export.json
```

Running through these options:

- `-c / --compact-output` makes sure the JSON objects remain compact and not pretty printed
- `-s / --slurp` reads each object into an in-memory array instead of processing one object at a time, which we need in order to sort the file
- `-M / --monochrome-output` prevents the JSON from being colorized in the terminal
- `-S / --sort-keys` makes sure that each JSON object's keys are sorted, ensuring that the order of keys within each object payload is consistent between exports when we compare them

And, of course, the `jq` expression to sort the file itself is quite terse! It's just `sort_by(.genius_id)`, which sorts the slurped in array by id, and then there's a little `[]` on the end which basically splays the sorted array back out into newline-delimited JSON.

This takes a little while, but once it's done we've got two sorted files ready to be compared!

But wait.. not so fast. There are still a few keys in our export, specifically `featured_artists` and `producers` that are arrays of string values, and it's not guaranteed that each export will generate those in the same order.

Not to worry: `jq` has a solution to that problem too! We want to sort each of those keys in the output as well, which we can do by complicating our expression just a little more:

```
$ cat old_export.json | jq -csMS 'map(.featured_artists |= sort | .producers |= sort) | sort_by(.genius_id)[]' > sorted_old_export.json
```

So now the expression is a little more tricky. Let's break it down.

- `map` does what you expect and maps over each object, much as `sort_by` operates on each object.
- Within that `map` operation we're first calling `.featured_artists |= sort`, which uses the [`|=` update operator](https://stedolan.github.io/jq/manual/#Update-assignment:|=) to do an in-place alphabetic sort on the `featured_artists` array. This is a bit confusing, but all it's doing is running the value of `featured_artists` through a `sort` "filter", sorting it, then assigning that sorted value back to the `featured_artists` key of the object, and passing on the the entire object that `featured_artists` key is in. It would be equivalent to `map(.featured_artists = (.featured_artists | sort))`. If you don't know what that `|` does, don't worry.. read on!
- Next up we use [`|` operator](https://stedolan.github.io/jq/manual/#Pipe:|) to pipe the previous step to our next step which just sorts the `producers` array exactly as we did the `featured_artists` array. The pipe operator works exactly like the unix-style pipe on the command line, so we're essentially sorting the `featured_artists` array, returning the full object it resides in, and then running that same operation for `producers` on the result.
- And then we just feed that object with its sorted arrays into our sort operator from before using another pipe.

And voila! We've got two normalized 5 GB JSON blobs, all that's left is to feed them back into our `diff` operation just like before to see how similar they are:

```
$ echo "scale=3; $(diff --side-by-side --suppress-common-lines sorted_old_export.json sorted_new_export.json | wc -l) / $(wc -l < sorted_new_export.json)" | bc
.002
```

So after all that normalizing we find that only 0.2% of the lines differ between the exports! That's an incredible start for a complete rewrite of fairly complicated export process. Plus this whole thing takes about 10 minutes to generate each normalized file on my macbook pro and then less than a minute to compare them, already much faster than my naive ruby script.

The final step was looking through specific differing examples to figure out why the logic produced slightly different export outputs, but getting into the details of that is application logic and not what this post is about.

Hopefully now you'll reach for `jq` the next time you want to manipulate JSON files on the command line.. or at least if you want to pretty print an API response.

## Additional discussion

One thing that bugged me about this solution was the explicit sorting of each key. What if we later added more arrays, or if we had deeply nested objects! Since we were just comparing two specific export results with an unchanging schema over the course of a couple of weeks, this didn't really matter, but it was bugging me so I poked around looking for a more generic way of normalizing JSON objects.

If you check out the [`jq` FAQ](https://github.com/stedolan/jq/wiki/FAQ#general-questions) you'll find that there was a function called `walk` introduced as a built-in after 1.5, which allows you deeply iterate through JSON objects and modify them. It wasn't in the version I was using but it was simple enough to copy it into my program, which it turns out made the code much simpler:

```javascript
# from https://github.com/stedolan/jq/wiki/FAQ#general-questions

def walk(f):
  . as $in
    | if type == "object" then
    reduce keys_unsorted[] as $key
    ( {}; . + { ($key):  ($in[$key] | walk(f)) } ) | f
    elif type == "array" then map( walk(f) ) | f
    else f
    end;

# actual custom jq program
walk( if type == "array" then sort else . end ) | sort_by(.genius_id)[]
```

It turned out that this also made it significantly slower to normalize each file, so I ended up just using the more verbose and brittle version, but the `walk` version is a lot cleaner!

Also, you might be curious how you can run the above file.. you can also run `jq` program files using the `-f` option, so:

```
$ cat my_file.json | jq -csMS -f normalize.jq
```
