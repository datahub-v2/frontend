---
title: How to contribute to DataHub docs?
date: 2017-10-04
authors: ['Mikanebu']
---


### How to contribute to DataHub docs?

You are always welcome to open PR for DataHub docs.
Since you know how markdown works, there are only couple steps you need to know:

* Template - template for home docs page is located in `views/docs_home.html`, the rest docs use `views/docs.html`
* css - our default css class is `docs` which is located `/public/sass/_doc.scss`. We use preprocessors like [*Sass*][sass]

**Note:** *file name should be lowercased without any white spaces*.

### How to write blogs on DataHub?

All blogs are located in `blog` section. Blogs use [markdown](/docs/misc/markdown) language.  
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
[markdown]: /docs/misc/markdown