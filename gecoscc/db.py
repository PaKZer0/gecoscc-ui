#
# Copyright 2013, Junta de Andalucia
# http://www.juntadeandalucia.es/
#
# Authors:
#   Antonio Perez-Aranda <ant30tx@gmail.com>
#   Pablo Martin <goinnn@gmail.com>
#
# All rights reserved - EUPL License V 1.1
# https://joinup.ec.europa.eu/software/page/eupl/licence-eupl
#

import pymongo

DEFAULT_MONGODB_HOST = 'localhost'
DEFAULT_MONGODB_PORT = 27017
DEFAULT_MONGODB_NAME = 'gecoscc'
DEFAULT_MONGODB_URI = 'mongodb://%s:%d/%s' % (DEFAULT_MONGODB_HOST,
                                              DEFAULT_MONGODB_PORT,
                                              DEFAULT_MONGODB_NAME)


class MongoDB(object):
    """Simple wrapper to get pymongo real objects from the settings uri"""

    def __init__(self, db_uri=DEFAULT_MONGODB_URI,
                 connection_factory=None, **kwargs):

        self.db_uri = db_uri
        self.parsed_uri = pymongo.uri_parser.parse_uri(self.db_uri)

        if 'replicaSet' in kwargs:
            connection_factory = pymongo.MongoReplicaSetClient

        elif connection_factory is None:
            connection_factory = pymongo.MongoClient

        self.connection = connection_factory(
            host=self.db_uri,
            tz_aware=True,
            **kwargs)

        if self.parsed_uri.get("database", None):
            self.database_name = self.parsed_uri["database"]
        else:
            self.database_name = DEFAULT_MONGODB_NAME

    def get_connection(self):
        return self.connection

    def get_database(self, database_name=None):
        if database_name is None:
            db = self.connection[self.database_name]
        else:
            db = self.connection[database_name]
        if self.parsed_uri.get("username", None):
            db.authenticate(
                self.parsed_uri.get("username", None),
                self.parsed_uri.get("password", None)
            )
        self.indexes(db)
        return db

    def indexes(self, db):
        db.nodes.ensure_index([
            ('node_chef_id', pymongo.DESCENDING),
        ])
        db.nodes.ensure_index([
            ('path', pymongo.DESCENDING),
            ('type', pymongo.DESCENDING),
        ])
        # TODO: this try/except will be removed in review release
        try:
            db.nodes.ensure_index([
                ('name', pymongo.DESCENDING),
                ('type', pymongo.DESCENDING),
            ])
        except pymongo.errors.OperationFailure:
            db.nodes.drop_index('name_-1_type_-1')
            db.nodes.ensure_index([
                ('name', pymongo.DESCENDING),
                ('type', pymongo.DESCENDING),
            ])

        db.jobs.ensure_index([
            ('userid', pymongo.DESCENDING),
        ])


def get_db(request):
    return request.registry.settings['mongodb'].get_database()
