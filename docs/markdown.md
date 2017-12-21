---
title: 5 minutes Markdown guide
---


[TOC]

Markdown is an easy-to-use markup language, used to format docs for web, using plain text.  
Used by datahub, github, bitbucket and many many more.

### text:

`usual text` usual text  
`*italic text*` *italic text*   
`**bold text**` **bold text**,  
`~~crossed though~~` ~~crossed though~~  
`double space` - linebreak

`---` line:

---  
### Blockquotes

```
Santa Claus said:
> Happy Christmas, hohoho
```
Santa Claus said:
> Happy Christmas, hohoho


### Headers 

```
# this is a Header1
## Header2
...
###### Header6
```

### links

`https://example.com` https://example.com - automatic  
`[Example](https://example.com)` [Example](https://datahub.io) - defined text  
`![alt text](https://goo.gl/YPFoy5 "image title")`
![alt text](https://goo.gl/YPFoy5 "image title")

### lists

```
* task 1
* task 2
  * task 2a
  * task 2b
```
* task 1
* task 2
  * task 2a
  * task 2b

List with checkboxes:
```
* [x] unchecked 
* [ ] checked
```

* [x] task 1 
* [ ] task 2

## code

```
This is an inline code: `inline code`
```
This is an inline code: `inline code`
  
Multi-line code starts with triple back apostrophe (also you can add the programming language name - ```[python|bash|php|etc]  
print('hello world)
```python
print('hello world)
```
and ends with triple back apostrophe as well.

---
As you can see, formatting text with Markdown is as easy as using notepad. Also, the markdown syntax could be extended easily, and here is the features, that we added, and you can use them to format pages for datahub.

## DataHub specific features

### How to contribute to DataHub docs?

You are always welcome to open PR for DataHub docs.
Since you know how markdown works, there are only couple steps you need to know:

* Table of content - DataHub docs are created by Markdown processor, and each document has TOC where you need to define your title, date etc.
```
---
title: Installing data
date: 2017-09-19
---
```
* Template - template for home docs page is located in `views/docs_home.html`, the rest docs use `views/docs.html`
* css - our default css class is `docs` which is located `/public/sass/_doc.scss`. We use preprocessors like [*Sass*][sass]

**Note:** *file name should be lowercased without any white spaces*.

### How to write blogs on DataHub?

All blogs are located in `blog` section. Blogs use markdown language with table of content. 
```
---
title: How much space are you using?
date: 2017-10-04
authors: ['anuveyatsu']
---
```

**Note:** *file name should be lowercased without any white spaces and concatenated date in the beginning*.
```
blog/2017-10-04-space-usage
```
* Template - template for blog page is located in `views/blog.html`.
* css - our default css class is `blog` which is located `/public/sass/_blog.scss`. We use preprocessors like [*Sass*][sass]



[sass]: http://sass-lang.com/