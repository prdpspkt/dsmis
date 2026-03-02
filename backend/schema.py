import graphene
from graphene_django import DjangoObjectType


class Query(graphene.ObjectType):
    status = graphene.String()

    def resolve_status(root, info):
        return "Driving School Management System API is running!"


# Import schemas from all apps
from students.schema import Query as StudentQuery, Mutation as StudentMutation
from accounting.schema import Query as AccountingQuery, Mutation as AccountingMutation
from core.schema import Query as CoreQuery, Mutation as CoreMutation


class Query(CoreQuery, StudentQuery, AccountingQuery, graphene.ObjectType):
    pass


class Mutation(CoreMutation, StudentMutation, AccountingMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
