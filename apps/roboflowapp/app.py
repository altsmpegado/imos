from inference_sdk import InferenceHTTPClient
import os
from PIL import Image
# import supervision to visualize our results
import supervision as sv

# define the image url to use for inference
project_id = "ppe-dataset-for-workplace-safety"
model_version = 1
image = Image.open("bigstock-Asian-Mechanical-Workers-Worki-422674316.jpg")

# create a client object
client = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="4BRQaWP7CIwFCAqFJkHW",
)

# run inference on the image
results = client.infer(image, model_id=f"{project_id}/{model_version}")

print(results)
detections = sv.Detections.from_inference(results)

# create supervision annotators
bounding_box_annotator = sv.BoundingBoxAnnotator()
label_annotator = sv.LabelAnnotator()

# annotate the image with our inference results
annotated_image = bounding_box_annotator.annotate(
    scene=image, detections=detections)
annotated_image = label_annotator.annotate(
    scene=annotated_image, detections=detections)

# display the image
sv.plot_image(annotated_image)