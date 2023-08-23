# Polar Spirals -- Sporals? Spilars?

## What's this all about?

A long long time ago (nearly 20 years?) I had the idea that an exponential spiral coordinate representation might be advantageous for image recognition. When I say exponential spiral, I simply mean a spiral whose distance from the origin increases by a constant factor with each revolution. Just like the function e^x never reaches 0, such a spiral would never reach the origin. This would provide a space filling curve that conveniently quantized 2 dimensions down into 1. 

To put it in polar coorinate terms, imagine the function:

    r = e^theta

I don't actual propose using e as the base of the exponent, it just happened to be convenient for explanatory purposes. From a binary perspective, 2 seemed to be a likely contender for the base. And I thought breaking each rotation into 16 segments seemed equally convenient. Convenient doesn't necessarily mean functional though.

## Why would this be beneficial?

Cartesian coordinates provide a certain amount of invariance to translation (shifting the image up, down, left or right). The pixels move, but they stay the same relative to their neighbors. A dog still looks like a dog when you move it somewhere else on the page. 

In contrast, polar coordinates are not invariant to translation, but they are invariant to rotation around the origin and shifts along the radius have the effect of scaling the size of an image up or down. Spiral coordinates are similar, but any rotation is accompanied by a shift in size. 

Since pictures tend to include the same things, but at different sizes and rotations, I thought a representation that is invariant to size and rotation might have some benefits. A square of any rotation or size would have the same sliding window outline... assuming it was first centered.

Another reason that I thought such a representation might make sense was because it automatically introduced an element of focus/attention. We humans have periferal vision, but it's less useful that the the information centering around the thin we're looking at. A spiral representation would provide much more detailed data around the center than it would around the peripheral.

## A New Spin with Convolutions

I never did anything with the idea. Over the years when I had full control over my time, I considered looking into it, but never got very far. I thought the first step would be to build a transformation function that could convert 2d bitmaps into a spiral representation. I always imagined having to aggregate/average all of the pixels for a given region -- similar to resizing an image to a smaller resolution. It never really occurred to me to use a lazy sampling method -- until recently. 

CNNs (Convolutional Neural Networks) make use of 2d convolution functions to break an image up into "patches" -- sliding windows of arbitrary sizes of pixels (for instance 3x3). They then apply some trainable kernel to that window -- the kernel is essentially a set of vectors that are dot producted with the pixels in the window to extract relevant features of detail. At low levels they often detect gradients or shades -- but those features are pooled and passed into more layers of convolutions which combine those low level features detected into higher level abstract concepts. 

Rather than grabbing all 9 pixels from a 3x3 window, I was thinking I could apply the spiral concept by sampling from an NxM window to output a fixed vector of pixels. 

## Spiral Explorer

I built the [spiral explorer](spiral.html) in order to test out some different sampling methods. It would be nice to get relatively even coverage of all pixels across the image -- a pattern of over or under sampling would likely lead to unwanted artifacts. I wanted to be able to see how different selections of angular segmentation (how many pixels to sample for each rotation), cyclical multiplyer (the base exponent that determines the size increase with each revolution), starting radius, number of cycles, x and y offsets for rounding and other choices as well as stride length for sliding the window would effect the over and understampling of pixels. 

The explorer lets you select various parameters and then visualize which pixels will be sampled more times, or not at all by painting those pixels with partial transparency. Pixels that are sampled more show up darker and pixels that are never sampled show up white. 

## 2d and 1d outputs

At the moment, I kind of like the idea of using 3 cycles of 12 segments. You could actually think of this like three octaves of musical notes (particularly if using 2 as the base since there are 12 notes per octave and their frequency doubles with each octave). 

That would provide a 1d column of 36 pixels. That sequence of 36 pixels could then be convolved into 1d sliding windows of some length.

At the same time, it could also be viewed as a 6x6 grid of 2 dimensional pixels. Each row of the grid would represent a semi circle from the original spiral and each column would represent a line of pixels cutting through the center. You could apply standard 2d convolutions to such a representation. 

I think I like this [one](http://bunsen.localdomain:8080/spiral.html?initialRadius=1.48&startAngle=7&cycleMultiplier=2&stride=4&tile=1&segments=12&cycles=3&xShift=1&yShift=-1). The size doubles every cycle, so the outer swirl is 4 times as large as the inner swirl meaning a stride of four would give second round inner swirls that are the same size as the outer swirl of the previous round. That should give full and consistent coverage for objects of various sizes and rotations. 

I take back my initial thoughts of treating this as a 6x6 grid -- I think a single column broken up into 25 sliding windows of length 12 gives us something closer to my initial intent. Modding that same 36 pixel column by 6 gives us the 6 diagonals which I think will be useful (necessary) for orientation -- i.e. some semblance of upness.


