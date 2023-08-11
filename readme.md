# Kernel Explorer

My goal here is to build a basic tool for interactively exploring the weights of the dense layers of a feed forward neural network. 

Each dense layer contains a matrix of weights which is multiplied by the outputs of the previous layer. The matrix contains one row per input and one column per output -- each column vector is dot multiplied with the row vector of input values. The result is a new row vector to which a bias is added and finally a non linear activation function is applied. 

One way to explore the kernels would be to watch how they respond to a particular sample input, however I'm generally more interested in reverse engineering the outputs by following them back to see the probable range of inputs that would be important.

I usually start at the last kernel to see which inputs have the greatest effect on the overall output, or on the determination of a single class (in a multiclass classifier). That usually requires sorting the kernel rows by the absolute value of weights -- either for an individual column vector, or by the "length" of the combined row vector. Thus it would be nice to display not only the weights of the kernel as a heat map, but also a neighboring column with all of the l2 norms (as well as a neighboring row with corresponding column vector lengths). 

It would be nice to be able to sort the matrix rows or columns by either individual columns/rows, or by the average value (l2 norm) of those rows or columns. 

From there I'd like to be able to "zoom" in to a row or column to see the rows/columns from the previous layer that feed into it. 
