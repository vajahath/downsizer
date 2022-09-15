# downsizer

A tiny tool to reduce size of images in bulk. Helps you to bulk reduce size of images in a folder or individual images.

## Install

- Install [Node.js](https://nodejs.org/en/) first.
- Check Node.js is installed by running `node --version`
- Then run `npx downsizer --version`

## Usage

- Put your photos into a folder
- Open Command Prompt / terminal / Power Shell, and go to that folder.
- Run `npx downsizer "./*.jpg"` : this will downsize all your `.jpg` files and put them in the `./downsized` directory inside that folder.

### Extra options

```bash
# reduce all jpg files in a directory
npx downsizer "./*.jpg"

# reduce a single file
npx downsizer "/path/to/my/file.jpg"

# default quality is 80
npx downsizer --quality=50 "./*.jpg"

```

### Internals

Under the hood, this library uses sharp and uses a thread pool to parallize the tasks.

### Motivation

During the State Ijthima held on Karunagappally, Kerala, tons of photos were taken with professional cameras and DSLRs. Photos taken with professional cameras and DSLR are often huge in size. Hence those are hard to manipulate / upload.

This tiny tool was made to reduce size of photos.

## Licence

MIT &copy; Vajahath Ahmed
