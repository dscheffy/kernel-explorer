# Kernel Explorer

Try it out [here](https://dscheffy.github.io/kernel-explorer/)!

My goal here is to build a basic tool for interactively exploring the weights of the dense layers of a feed forward neural network. 

Each dense layer contains a matrix of weights which is multiplied by the outputs of the previous layer. The matrix contains one row per input and one column per output -- each column vector is dot multiplied with the row vector of input values. The result is a new row vector to which a bias is added and finally a non linear activation function is applied. 

One way to explore the kernels would be to watch how they respond to a particular sample input, however I'm generally more interested in reverse engineering the outputs by following them back to see the probable range of inputs that would be important.

I usually start at the last kernel to see which inputs have the greatest effect on the overall output, or on the determination of a single class (in a multiclass classifier). That usually requires sorting the kernel rows by the absolute value of weights -- either for an individual column vector, or by the "length" of the combined row vector. Thus it would be nice to display not only the weights of the kernel as a heat map, but also a neighboring column with all of the l2 norms (as well as a neighboring row with corresponding column vector lengths). 

I thought It would be nice to be able to sort the matrix rows or columns by either individual columns/rows, or by the average value (l2 norm) of those rows or columns. 

From here I'd like to be able to "zoom" in to a row or column to see the rows/columns from the previous layer that feed into it. 


## Other Ideas

I just got a basic initial draft working that displays the kernel matrix of a dense layer along with a drop down for selecting which layer to display. One thing that occurred to me while switching through the layers is that it might help to show at right angles to one another in a pipeline of sorts. The oututs of each layer flow into the inputs of the subsequent layer -- the rows map to the inputs, and the columns to the outputs, but if you transposed all of the even layers, then columns would map to inputs and rows to outputs, so you could position the even layers below the odd ones and the odd ones to the right of the even ones in such a way that columns flow down into columns and rows flow over to neighboring rows. Rather than a waterfall, you where transposed layers are always under nontransposed layers, you could alternate down/up to fit it all into landscape oriented rectangle a little better. 
