import boto3
import os
from urllib.parse import unquote_plus
import pathlib
import json

s3_client = boto3.client('s3')
event_client = boto3.client('events')

def lambda_handler(event, context):
  #print("Received event: " + json.dumps(event, indent=2))
  for record in event['Records']:
      bucket = record['s3']['bucket']['name']
      key = unquote_plus(record['s3']['object']['key'])
      size = event['Records'][0]['s3']['object']['size']
      eTag = unquote_plus(record['s3']['object']['eTag'], encoding='utf-8')
      filename = os.path.basename(key)
      filepath = os.path.splitext(key)[0]
      file_extension = pathlib.Path(key).suffix
      newfilename = os.path.splitext(filename)[0] + '.pdf'
      newkey = filepath + '.pdf'
      input = {
                "Bucket" : bucket,
                "Key" : key,
                "Size" : size,
                "eTag" : eTag,
                "Filename" : filename,
                "Newfilename" : newfilename,
                "File_extension" : file_extension,
                "newkey" : newkey
            }
      json_input = json.dumps(input, separators=(',', ':'))
      response = event_client.put_events(
          Entries=[
              {
                  'Source': 'my-custom-event',
                  'DetailType': 'S3PutEventTrigger',
                  'Detail': json_input,
                  'EventBusName': os.environ["eventBusName"]
              }
          ]
      )
      print(json.dumps(input))
      print(response)
