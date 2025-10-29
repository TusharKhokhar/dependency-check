@startTranslation
Feature: Translation lambda handler
  Scenario: Translation lambda triggered
    Given the translation lambda is triggered have for the first time
    When Source Language is english and target language is hindi
    Then After uploading file on on azure it successfully calls start translation API
    Then The Track Id is updated in the database against the job record

  Scenario: Translation lambda triggered duplicate event
    Given the translation lambda is triggered have isTranslated flag set as false
    When The incoming event is for job which is already having TranslationTrackID
    Then It should not call start translation API




