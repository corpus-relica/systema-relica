from src.relica_nous_langchain.SemanticModel import semanticModel
from src.relica_nous_langchain.utils.EventEmitter import EventEmitter
import requests
import socketio

import os
from dotenv import load_dotenv
load_dotenv()  # This loads the variables from .env

CC_URI = os.getenv("CC_URI")

print("MUTHERFUCKING URI -- ", CC_URI)

class CCComms:

    def __init__(self):
        print("CCCOMS CONSTRUCTOR")
        self.selectedEntity = None

        self.emitter = EventEmitter()
        self.sio = socketio.Client()

        self.sio.on('system:selectedEntity', self.handleSelectedEntity)
        self.sio.on('system:selectedNone', self.handleSelectedNone)
        self.sio.on('system:loadedFacts', self.handleAddFacts)
        self.sio.on('system:loadedModels', self.handleAddModels)
        self.sio.on('system:unloadedFacts', self.handleRemoveFacts)
        self.sio.connect(CC_URI)   #+ '?clientName=NOUS')

    def handleSelectedEntity(self, data):
        if data['uid'] == None:
            self.handleSelectedNone(data)
        else:
            self.selectedEntity = data['uid']
            self.emitter.emit('selectedEntity', data['uid'])

    def handleSelectedNone(self, data):
        self.selectedEntity = None
        self.emitter.emit('selectedEntity', None)

    def handleAddFacts(self, data):
        semanticModel.addFacts(data['facts'])
        ## self.emitter.emit('addFacts', data['facts'])

    def handleAddModels(self, data):
        semanticModel.addModels(data['models'])

    def handleRemoveFacts(self, data):
        semanticModel.removeFacts(data['fact_uids'])

        # Create a list of model UIDs to remove
        models_to_remove = []
        for uid, model in semanticModel.models.items():
            if not semanticModel.hasFactInvolvingUID(uid):
                models_to_remove.append(uid)
                if uid == self.selectedEntity:
                    self.selectedEntity = None
                    self.emitter.emit('selectedEntity', None)

        # Remove models
        for uid in models_to_remove:
            semanticModel.removeModel(uid)

        print("AFTER REMOVE FACTS")
        # number of models and facts
        print(len(semanticModel.models), len(semanticModel.facts))
        # self.emitter.emit('removeFacts', data['facts'])

    def retrieveEnvironment(self):
        print("RETRIEVE ENVIRONMENT -- ", CC_URI , '/environment/retrieve')
        response = requests.get(CC_URI + '/environment/retrieve')
        if response.status_code == 200:
            print(response)
            return(response.json())
        else:
            print("Failed to retrieve CC Environment")

    def loadEntity(self, uid):
        response = requests.get(CC_URI + '/environment/loadEntity/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to load entity")

    def textSearchExact(self, term):
        response = requests.get(CC_URI + '/environment/textSearch/' + term)
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to text search exact")
            print(response)

    def specializeKind(self, uid, supertype_name, name):
        print("SPECIALIZE KIND")
        print(uid, name)
        response = requests.get(CC_URI + '/environment/specializeKind/' + str(uid) + '/' + supertype_name + '/' + name)
        if response.status_code == 200:
            return(response.json())
        else:
            return { "error": 'Failed to specialize kind' }

    def classifyIndividual(self, uid, kind_name, name):
        print("CLASSIFY INDIVIDUAL")
        response = requests.get(CC_URI + '/environment/classifyIndividual/' + str(uid) + '/' + kind_name + '/' + name)
        if response.status_code == 200:
            return(response.json())
        else:
            return { "error": 'Failed to classify individual' }

    def emit(self, role:str, type:str, payload, callback=None):
        if(self.sio):
            if(callback):
                print("EMITTING WITH CALLBACK")
                self.sio.emit(role + ':' + type, data=payload, callback=callback)
            else:
                self.sio.emit(role + ':' + type, data=payload)

    def retrieveSpecializationHierarchy(self, uid):
        response = requests.get(CC_URI + '/environment/loadSpecializationHierarchy/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to retrieve specialization hierarchy")

    def retrieveSpecializationFact(self, uid):
        response = requests.get(CC_URI + '/environment/loadSpecialization/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to retrieve specialization")

    def retrieveClassified(self, uid):
        response = requests.get(CC_URI + '/environment/loadClassified/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to retrieve classified")

    def retrieveClassificationFact(self, uid):
        response = requests.get(CC_URI + '/environment/loadClassification/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to retrieve classification")

    def retrieveAllRelatedFacts(self, uid):
        response = requests.get(CC_URI + '/environment/loadAllRelatedFacts/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to retrieve all related facts")

    def retrieveSubtypes(self, uid):
        print("RETRIEVE SUBTYPES", CC_URI + '/environment/listSubtypes/' + str(uid))
        response = requests.get(CC_URI + '/environment/listSubtypes/' + str(uid))
        if response.status_code == 200:
            return(response.json())
        else:
            print("Failed to retrieve subtypes")

ccComms = CCComms()
