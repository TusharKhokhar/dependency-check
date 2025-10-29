import boto3
import os
import uuid
from urllib.parse import unquote_plus
from PIL import Image, ImageFile, ImageMode
import PIL.Image
import json
from pillow_heif import register_heif_opener
register_heif_opener()

PIL.Image.MAX_IMAGE_PIXELS = None
s3_client = boto3.client('s3')

def convert_image(image_path, converted_path):
  with Image.open(image_path) as image:
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    print('width: ', image.width)
    print('height:', image.height)
    print('mode:', image.mode)
    #print('info:', image.info)
    if image.mode == 'RGBA':
      convert_rgba_to_rgb(image_path, converted_path)
    else:
      image.convert('RGB') # 'RGB' color and 'L' grayscale
      image.save(converted_path, 'PDF', quality=100)

def convert_rgba_to_rgb(image_path, converted_path):
  with Image.open(image_path) as image:
    image.load() # required for png.split()
    background = Image.new("RGB", image.size, (255, 255, 255))
    background.paste(image, mask=image.split()[3]) # 3 is the alpha channel
    background.save(converted_path, 'PDF', quality=100)

def lambda_handler(event, context):
  json_event_data = {
          "Newfilename": event['detail']['newkey'],
          "Key": event['detail']['Key'],
          "newkey": event['detail']['newkey'],
    }
  try:
    print("Received event: " + json.dumps(event, indent=2))
    bucket = event['detail']['Bucket']
    key = event['detail']['Key']
    filename = event['detail']['Filename']
    newkey = event['detail']['newkey']
    newfilename = event['detail']['Newfilename']
    image_path = '/tmp/{}{}'.format(uuid.uuid4(), filename) #Might not need to do this because upload will be with this uuid
    converted_path = '/tmp/converted-{}'.format(newfilename)
    s3_client.download_file(bucket, key, image_path)
    print(filename)
    convert_image(image_path, converted_path)
    s3_client.upload_file(converted_path, '{}-converted'.format(bucket), newkey)
    os.remove(image_path)
    os.remove(converted_path)
  except Exception as e:
    json_event_data['errorMessage'] = str(e)
    print("Error Processing File: ","Details:",json.dumps(json_event_data) )