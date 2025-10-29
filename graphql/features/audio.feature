@Audio
 Feature: Audio
 
     Scenario: Successfully add a new audio
         Given I have a valid audio input
         When I send a request to add the audio
         Then the response of audio should have status code 200
         And the response of audio should contain audio details
 
     Scenario: Successfully update an audio
         Given I have a valid audio update input
         When I send a request to update the audio
         Then the response of audio should have status code 200
         And the response of audio should contain a success message
 
     Scenario: Successfully change the status of an audio
         Given I have a valid audio status input
         When I send a request to change the audio status
         Then the response of audio should have status code 200
 
     Scenario: Successfully get audio details
         Given I have a valid audio ID
         When I send a request to get the audio
         Then the response of audio should have status code 200
 
     Scenario: Successfully delete an audio
         Given I have a valid audio delete input
         When I send a request to delete the audio
         Then the response of audio should have status code 200
	         And the response of audio should contain a success message