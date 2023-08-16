# Kernel Explorer

> This is an initial proof of concept, so it's definitely a bit ugly (the code included). 

## What is this?

I've trained a basic MLP (multilayer perceptron) classifier on the [MNIST](https://en.wikipedia.org/wiki/MNIST_database) dataset using this [python script](./train.py). The model is made up of 5 dense layers and I've trained two versions over 50 epochs saving the intermittent layer weights at the end of each epoch. Both versions use the same model architecture, the only difference is the weight initializer -- one uses the default random initializer for weights, the second uses a custom deterministic diagonal matrix initializer. 

The explorer lets you easily select which model (initialization), layer and epoch you want to look at. The kernel weights are visualized using color, but you can click on any cell to pull up a tooltip that shows you the actual numeric value of that weight. Along side and below the matrix I've also included displays for the row and column [L2 or Euclidean Norms](https://en.wikipedia.org/wiki/Norm_(mathematics)). After clicking on any cell, the tooltip gives you the option to sort the entire matrix by that cell's row or column. Sorting by the row/column norms can be useful for seeing where most of the decision making information is stored.


## Why I Built It

My goal here was to create a tool that would make it easier to dive into the kernel matrices that make up the dense layers of trained neural networks. I think a lot of people have a hard time grasping what's going on at this level and simply quickly give up trying because things just kind of work as is. I was hoping something like this tool or even just this approach to exploring the kernels might make understanding them a little bit easier. 

## Next Steps

I'd actually like to make it easier to follow the flow of information from one layer to the next or previous layer. I'm thinking about transposing adjacent layers and then displaying them next to, or above/below the current layer in order to line up rows with columns -- that way it would be easier to see how the inputs of one layer line up with the outputs of the previous, and how the outputs of the current layer map to the inputs of the next. 


