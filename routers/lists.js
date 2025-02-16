import express from 'express';
import axios from 'axios';
import handleError from '../handleError.js';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand  } from '@aws-sdk/lib-dynamodb';

const listsRouter = express.Router();

// Initialize DynamoDB Client
const client = new DynamoDBClient({ region: 'eu-north-1' });

const docClient = DynamoDBDocumentClient.from(client);

const tableName = "vikalp_lists_db"

// #######################################################################
// DyanmoDB utility functions

const fetchFullTable = async () => {

    let items = [];
    let lastEvaluatedKey = undefined;

    do {
        const params = {
            TableName: tableName,
            ExclusiveStartKey: lastEvaluatedKey, // For pagination
        };

        const command = new ScanCommand(params);
        const response = await docClient.send(command);

        items = items.concat(response.Items);
        lastEvaluatedKey = response.LastEvaluatedKey; // Check for more data

    } while (lastEvaluatedKey); // Continue fetching if there's more data
    
    return items;
};

async function addMultipleToArray(id, valuesToAdd) {
    const params = {
        TableName: tableName,
        Key: { id }, // Partition key
        UpdateExpression: "SET #attr = list_append(if_not_exists(#attr, :empty_list), :new_values)",
        ExpressionAttributeNames: { "#attr": "account_ids" }, // Change "myArray" to your actual field name
        ExpressionAttributeValues: { 
            ":empty_list": [], 
            ":new_values": valuesToAdd // Must be an array
        },
        ReturnValues: "UPDATED_NEW"
    };

    try {
        const response = await docClient.send(new UpdateCommand(params));
        console.log("Update successful:", response);
        return response;
    } catch (error) {
        console.error("Error updating item:", error);
    }
}

async function updateMultipleColumns(id, updates) {
    // Convert updates object {column1: value1, column2: value2} into a DynamoDB update expression
    const updateExpression = "SET " + Object.keys(updates).map((key, i) => `#col${i} = :val${i}`).join(", ");
    
    const ExpressionAttributeNames = Object.fromEntries(
        Object.keys(updates).map((key, i) => [`#col${i}`, key])
    );

    const ExpressionAttributeValues = Object.fromEntries(
        Object.values(updates).map((value, i) => [`:val${i}`, value])
    );

    const params = {
        TableName: tableName,
        Key: { id }, // Partition key
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "UPDATED_NEW"
    };

    try {
        const response = await docClient.send(new UpdateCommand(params));
        console.log("Update successful:", response);
        return response;
    } catch (error) {
        console.error("Error updating item:", error);
    }
}

async function deleteRow(id) {
    const params = {
        TableName: tableName,
        Key: { id }, // Partition key
        ReturnValues: "ALL_OLD" // Returns deleted item (optional)
    };

    try {
        const response = await docClient.send(new DeleteCommand(params));
        if (!response.Attributes) {
            console.log("Item not found, nothing to delete.");
            return { success: false, message: "Item not found" };
        }
        console.log("Delete successful:", response);
        return { success: true, deletedItem: response.Attributes };
    } catch (error) {
        console.error("Error deleting item:", error);
        return { success: false, error: error.message };
    }
}

// #################################################################################
// Public Lists Routes

//fetch public lists
listsRouter.get("/public", async (req, res) => {
    try {
        const response = await fetchFullTable(tableName);

        console.log(response);

        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        handleError(res, error)
    }
});

//create a public list (also creates a private list)
listsRouter.post("/public", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.query.instance}/api/v1/lists`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        const params = {
            TableName: tableName,
            Item: {
                id : response.data.id,
                title: response.data.title,
                owner: req.query.user
             },
        };

        const result = await docClient.send(new PutCommand(params));

        console.log(params, result)

        res.status(200).json({
            resultMetadata: result.$metadata  // Return the result metadata for debugging
        });

    } catch (error) {
        console.log(error)
        handleError(res, error)
    }
});

//fetch public single list
listsRouter.get("/public/:id", async (req, res) => {
    try {

        const params = { TableName: tableName, Key: { id: req.params.id} };

        const response = await docClient.send(new GetCommand(params));

        console.log(response);

        res.status(200).json(response.Item);
    } catch (error) {
        console.log(error);
        handleError(res, error)
    }
});

//fetch public list members
listsRouter.get("/public/:id/accounts", async (req, res) => {
    try {

        const params = { TableName: tableName, Key: { id: req.params.id} };

        const response = await docClient.send(new GetCommand(params));

        console.log(response);

        res.status(200).json(response.Item.account_ids);
    } catch (error) {
        console.log(error);
        handleError(res, error)
    }
});

//add members to a list (also adds to private list)
listsRouter.post("/public/:id/accounts", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        const result = await addMultipleToArray(req.params.id, req.body.account_ids)
        console.log(response, result)

        res.status(200).json({
            resultMetadata: result.$metadata  // Return the result metadata for debugging
        });

    } catch (error) {
        handleError(res, error)
    }
});

//update a public list (also updates the private list)
listsRouter.put("/public/:id", async (req, res) => {
    try {
        const response = await axios.put(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        const result = await updateMultipleColumns(req.params.id, req.body)
        console.log(response, result)

        res.status(200).json({
            resultMetadata: result.$metadata  // Return the result metadata for debugging
        });

    } catch (error) {
        handleError(res, error)
    }
});

//delete a public list (does not delete the private list)
listsRouter.delete("/public/:id", async (req, res) => {
    try {

        const result = await deleteRow(req.params.id)

        console.log(result)

        res.status(200).json(result);
    } catch (error) {
        handleError(res, error)
    }
});

// #################################################################################################
// Private Lists Rotues

//fetch user private lists
listsRouter.get("/", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/lists`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);

    } catch (error) {
        handleError(res, error)
    }
});

//create a private list
listsRouter.post("/", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.query.instance}/api/v1/lists`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        res.status(200).json(response.data);

    } catch (error) {
        handleError(res, error)
    }
});

//fetch a single private list
listsRouter.get("/:id", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//fetch list members
listsRouter.get("/:id/accounts", async (req, res) => {
    try {
        const response = await axios.get(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });
        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//add members to a list
listsRouter.post("/:id/accounts", async (req, res) => {
    try {
        const response = await axios.post(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//remove members from a list
listsRouter.delete("/:id/accounts", async (req, res) => {
    try {

        console.log(req.body);

        const response = await axios.delete(`https://${req.query.instance}/api/v1/lists/${req.params.id}/accounts`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//update a list
listsRouter.put("/:id", async (req, res) => {
    try {
        const response = await axios.put(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, req.body, {
            headers: {
                Authorization: `Bearer ${req.query.token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

//delete a list
listsRouter.delete("/:id", async (req, res) => {
    try {
        const response = await axios.delete(`https://${req.query.instance}/api/v1/lists/${req.params.id}`, {
            headers: {
                Authorization: `Bearer ${req.query.token}`, 
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        handleError(res, error)
    }
});

export default listsRouter;