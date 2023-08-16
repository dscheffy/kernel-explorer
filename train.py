import numpy as np
import tensorflow as tf
from tensorflow import keras
from keras import layers
from keras import backend
from keras import mixed_precision

## Custom class for initializing matrices in a more deterministic way
## by generating a diagonal(ish) matrix filled with alternating positive
## negative values of identical magnitude.
##   - Column vectors will be approximately unit length
##   - Most row/column vectors will be completely orthogonal, some will be
##     identical in the case where there are more vectors than dimensions
##   - Matrix will be sparse
##   - Sum of matrix values will be zero or near zero (for odd length diagonals)
@keras.saving.register_keras_serializable()
class Alternating(keras.initializers.Initializer):
    def __call__(self, shape, dtype=None, **kwargs):
        z = tf.zeros(shape, dtype=dtype)
        rows = z.shape[0]
        cols = z.shape[1]
        z = z.numpy()
        if rows > cols:
            l2 = 1/((rows/cols) ** 2) ** .5
            for i in range(rows):
                j = int(i/rows*cols)
                sign = i%2*2-1 # alternate 1, -1
                z[i,j] = sign * l2
        else:
            for j in range(cols):
                i = int(j/cols*rows)
                sign = j%2*2-1 # alternate 1, -1
                z[i,j] = sign

        z = tf.convert_to_tensor(z,dtype=dtype)
        return z

policy = mixed_precision.Policy('mixed_bfloat16')
mixed_precision.set_global_policy(policy)
print('Compute dtype: %s' % policy.compute_dtype)
print('Variable dtype: %s' % policy.variable_dtype)

# Model / data parameters
num_classes = 10
input_shape = (28 * 28)

# Load the data and split it between train and test sets
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

# Scale images to the [0, 1] range
x_train = x_train.astype("float32") / 255
x_test = x_test.astype("float32") / 255
x_train = np.reshape(x_train,(x_train.shape[0],28*28))
x_test = np.reshape(x_test,(x_test.shape[0],28*28))
print("x_train shape:", x_train.shape)
print(x_train.shape[0], "train samples")
print(x_test.shape[0], "test samples")


# convert class vectors to binary class matrices
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)

initializer=Alternating()
#initializer=tf.keras.initializers.GlorotNormal()

model = keras.Sequential(
    [
        keras.Input(shape=input_shape),
        layers.Dense(49, activation="tanh",kernel_initializer=initializer),
        layers.Dense(7, activation="tanh",kernel_initializer=initializer),
        layers.Dense(15, activation="tanh",kernel_initializer=initializer),
        layers.Dense(15, activation="tanh",kernel_initializer=initializer),
        layers.Dense(num_classes, activation="softmax",kernel_initializer=initializer),
    ]
)

model.summary()

## Save the model to json after every epoch using this function
import tensorflowjs as tfjs
suffix=0
def savejs():
  global suffix
  ## replace all custom initalizers with base classes
  for l in range(len(model.layers)):
    model.layers[l].kernel_initializer=tf.keras.initializers.Zeros()
#  tfjs.converters.save_keras_model(model, "models/random/"+str(suffix))
  tfjs.converters.save_keras_model(model, "models/diagonal/"+str(suffix))
  suffix=suffix+1

batch_size = 128
epochs = 50 

opt = tf.keras.optimizers.Adam(learning_rate=0.002)
model.compile(loss="categorical_crossentropy", optimizer=opt, metrics=["accuracy"])

## Save the initial state
savejs()

saving_callback=keras.callbacks.LambdaCallback(on_epoch_end=lambda epoch,logs: savejs())
model.fit(x_train, y_train, batch_size=batch_size, epochs=epochs, validation_split=0.1, callbacks=[saving_callback])

score = model.evaluate(x_test, y_test, verbose=0)
print("Test loss:", score[0])
print("Test accuracy:", score[1])


