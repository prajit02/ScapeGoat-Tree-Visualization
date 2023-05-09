class Node {
    constructor(data) {
        this.data = data;
        this.size = 1;
        this.left = null;
        this.right = null;
    }
};

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

class ScapegoatTree {
    constructor() {
        this.head = null;
        this.n = 0;
        this.q = 0;
        this.sg_list = [];
    }

    treeToArray(root, depth) {
        let arr = [];

        function inorder(node, depth) {
            if(node == null) return;

            inorder(node.left, depth + 1);

            removeNode(node.data + " " + depth);
            if(node.left == null && node.right == null) arr.push(node.data);

            inorder(node.right, depth + 1);
        }

        inorder(root, depth);

        console.log(arr);

        return arr;
    }

    async buildTree(arr, depth, pos_x, pos_y, f) {
        if(arr.length == 0) return null;

        console.log("depth", depth);
        changeNotesValue("Subtree nodes list: " + arr, "notes3");
        await waitForNext();

        if(arr.length == 1) {
            changeNotesValue("Subtree nodes list: " + arr, "notes3");
            changeNotesValue("Node " + arr[0] + " inserted", "notes4");

            let newNode = new Node(arr[0]);
            addNode(newNode.data + " " + depth, newNode.data, pos_x, pos_y);

            await showActiveNode(newNode.data + " " + depth);

            return [newNode, newNode];
        }

        let mid = parseInt(arr.length / 2);

        let left = [], right = [];
        for(let i=0; i<mid; i++) left.push(arr[i]);
        for(let i=mid; i<arr.length; i++) right.push(arr[i]);

        let leftNode = null, rightNode = null, left_leftMost = null, right_leftmost = null;

        [leftNode, left_leftMost] = await this.buildTree(left, depth + 1, pos_x - f/2, pos_y + 10, f/2);
        [rightNode, right_leftmost] = await this.buildTree(right, depth + 1, pos_x + f/2, pos_y + 10, f/2);

        let newNode = new Node(right_leftmost.data);
        addNode(newNode.data + " " + depth, newNode.data, pos_x, pos_y);

        changeNotesValue("Smallest node from right subtree: " + newNode.data, "notes4");
        await showActiveNode(newNode.data + " " + depth);
        
        newNode.left = leftNode;
        newNode.right = rightNode;

        if(newNode.left != null) addEdge(newNode.data + " " + depth, newNode.left.data + " " + (depth + 1));
        if(newNode.right != null) addEdge(newNode.data + " " + depth, newNode.right.data + " " + (depth + 1));

        newNode.size = 1 + newNode.left.size + newNode.right.size;

        changeNodeLabel(newNode.data + " " + depth, newNode.data + " (" + newNode.size + ")");

        return [newNode, left_leftMost];
    }

    async rebuild(root, depth, pos_x, pos_y, d) {
        changeNotesValue("Rebuilding Tree", "notes2");
        let arr = this.treeToArray(root, depth);
        // console.log(arr);
        let [newRoot, leftmost] = await this.buildTree(arr, depth, pos_x, pos_y, d);

        clearNotes();

        return newRoot;
    }

    async insert(new_data) {
        if(this.head != null) this.n += 2, this.q += 2;
        else this.n++, this.q++;
        updateNQ(this.n, this.q);

        let [head, imbalance] = await this.insertHelper(this.head, new_data, 0, null, 100, 10, 100);
        this.head = head;

        this.sg_list = [];
    }

    async insertHelper(node, new_data, depth, parent, pos_x, pos_y, f) {
        if(node == null) {
            let newNode = new Node(new_data);

            console.log(newNode.data, pos_x, pos_y);

            addNode(newNode.data + " " + depth, newNode.data, pos_x, pos_y);

            if(parent != null) addEdge(parent.data + " " + (depth - 1), newNode.data + " " + depth);

            changeNotesValue("Node " + newNode.data + " inserted", "notes2");
            // await new Promise(r => setTimeout(r, 2000));

            if(depth > getBaseLog(3/2, this.q)) {
                changeNotesValue("For Node " + newNode.data + ", depth(" + newNode.data + ") = " + depth + " > log<sub>3/2</sub>(" + this.q + ")", "notes3");
            } else {
                changeNotesValue("For Node " + newNode.data + ", depth(" + newNode.data + ") = " + depth + " <= log<sub>3/2</sub>(" + this.q + ")", "notes3");
            }

            await showActiveNode(newNode.data + " " + depth);

            clearNotes();

            console.log(depth, getBaseLog(3/2, this.q));
            if(depth > getBaseLog(3/2, this.q)) return [newNode, true];
            else return [newNode, false];
        }

        let left_child_node = null, right_child_node = null, imbalance = false;

        if(node.right == null) {
            changeNotesValue("Node " + node.data + " is at leaf", "notes2");
            if(node.data < new_data) changeNotesValue("insert below node and assign current node " + new_data, "notes3");
            else if(node.data > new_data) changeNotesValue("insert below node and assign current node " + node.data, "notes3");
            else {
                changeNotesValue("For Node " + node.data + ", " + new_data + " == " + node.data, "notes2");
                changeNotesValue("reject insertion", "notes3");

                this.n -= 2, this.q -= 2;
                updateNQ(this.n, this.q);

                await showActiveNode(node.data + " " + depth);

                return [node, false];
            }

            await showActiveNode(node.data + " " + depth);
            clearNotes();

            if(node.data < new_data) {
                removeNode(node.data + " " + depth);
                console.log("add", new_data, depth);
                addNode(new_data + " " + depth, new_data, pos_x, pos_y);
                if(parent != null) addEdge(parent.data + " " + (depth - 1), new_data + " " + depth);

                let temp = node.data;
                node.data = new_data;

                [right_child_node, imbalance] = await this.insertHelper(node.right, new_data, depth + 1, node, pos_x + f/2, pos_y + 10, f/2);
                [left_child_node, imbalance] = await this.insertHelper(node.left, temp, depth + 1, node, pos_x - f/2, pos_y + 10, f/2);
                node.left = left_child_node;
                node.right = right_child_node;
            } else if(node.data > new_data) {
                [right_child_node, imbalance] = await this.insertHelper(node.right, node.data, depth + 1, node, pos_x + f/2, pos_y + 10, f/2);
                [left_child_node, imbalance] = await this.insertHelper(node.left, new_data, depth + 1, node, pos_x - f/2, pos_y + 10, f/2);

                node.left = left_child_node;
                node.right = right_child_node;
            }

            node.size = 1 + node.left.size + node.right.size;
            changeNodeLabel(node.data + " " + depth, node.data + " (" + node.size + ")");

            return [node, imbalance];
        } else {
            let child_node = null, child_size = 0;

            if(node.data > new_data) {
                changeNotesValue("For Node " + node.data + ", " + new_data + " < " + node.data, "notes2");
                changeNotesValue("go to left subtree", "notes3");
            } else {
                changeNotesValue("For Node " + node.data + ", " + new_data + " >= " + node.data, "notes2");
                changeNotesValue("go to right subtree", "notes3");
            }

            await showActiveNode(node.data + " " + depth);

            clearNotes();

            if(node.data > new_data) {
                [child_node, imbalance] = await this.insertHelper(node.left, new_data, depth + 1, node, pos_x - f/2, pos_y + 10, f/2);
                node.left = child_node;

                child_size = node.left.size;

                // if(new_node == true) addEdge(node.data, node.left.data);
            } else {
                [child_node, imbalance] = await this.insertHelper(node.right, new_data, depth + 1, node, pos_x + f/2, pos_y + 10, f/2);
                node.right = child_node;

                child_size = node.right.size;

                // if(new_node == true) addEdge(node.data, node.right.data);
            } 
            // else {
            //     this.n -= 2, this.q -= 2;
            //     updateNQ(this.n, this.q);

            //     return [node, false];
            // }

            if(node.left == null && node.right == null) node.size = 1;
            else if(node.left == null) node.size = 1 + node.right.size;
            else if(node.right == null) node.size = 1 + node.left.size;
            else node.size = 1 + node.left.size + node.right.size;

            changeNodeLabel(node.data + " " + depth, node.data + " (" + node.size + ")");

            if(imbalance == false) {
                await showActiveNode(node.data + " " + depth);
                clearNotes();

                return [node, false];
            } else {
                if((3 * child_size) > (2 * node.size)) {
                    changeNotesValue("For node " + node.data + ", childsize/nodesize = " + child_size + "/" + node.size + " > 2/3","notes2");
                    await showActiveNode(node.data + " " + depth);

                    node = await this.rebuild(node, depth, pos_x, pos_y, f);

                    if(parent != null) addEdge(parent.data + " " + (depth - 1), node.data + " " + depth);

                    clearNotes();

                    return [node, false];
                } else {
                    changeNotesValue("For node " + node.data + ", childsize/nodesize = " + child_size + "/" + node.size + " <= 2/3","notes2");
                    await showActiveNode(node.data + " " + depth);

                    clearNotes();

                    return [node, true];
                }
            }
        }
    }

    async delete(node_id) {
        this.n -= 2;
        updateNQ(this.n, this.q);

        this.head = await this.deleteHelper(this.head, 0, null, node_id, 100, 10, 100);

        if(this.q > 2 * this.n) {
            this.head = await this.rebuild(this.head, 0, 100, 10, 100);

            this.q = this.n;
            updateNQ(this.n, this.q);
        }

        clearNotes();
    }

    async deleteHelper(node, depth, parent, del_key, pos_x, pos_y, f) {
        if(node == null) return node;

        if(node.right == null) {
            if(node.data == del_key) {
                changeNotesValue("Delete Node " + node.data, "notes2");
                await showActiveNode(node.data + " " + depth);

                removeNode(node.data + " " + depth);
                return null;
            } else {
                changeNotesValue("Node not found ", "notes2");
                changeNotesValue("Reject deletion ", "notes3");

                this.n += 2;
                updateNQ(this.n, this.q);

                await showActiveNode(node.data + " " + depth);

                return node;
            }
        } else {
            if(node.data > del_key) {
                changeNotesValue("For Node " + node.data + ", " + del_key + " < " + node.data, "notes2");
                changeNotesValue("go to left subtree", "notes3");
            } else {
                changeNotesValue("For Node " + node.data + ", " + del_key + " >= " + node.data, "notes2");
                changeNotesValue("go to right subtree", "notes3");
            }

            await showActiveNode(node.data + " " + depth);
            clearNotes();

            console.log("node ", node.data, del_key);

            if(node.data > del_key) {
                node.left = await this.deleteHelper(node.left, depth + 1, node, del_key, pos_x - f/2, pos_y + 10, f/2);

                if(node.left == null) {
                    changeNotesValue("delete node", "notes2");
                    await showActiveNode(node.data + " " + depth);

                    removeNode(node.data + " " + depth);

                    node = node.right;
                    this.reposition(node, depth + 1, null, pos_x, pos_y, f);
                    if(parent != null) addEdge(node.data + " " + depth, parent.data + " " + (depth - 1));

                    // node.data = node.right.data;
                    // node.size = 1;
                    // node.right = await this.deleteHelper(node.right, depth + 1, node, parseInt(node.right.data), pos_x + f/2, pos_y + 10, f/2);
                } else {
                    node.size = 1 + node.left.size + node.right.size;
                }
            } else {
                node.right = await this.deleteHelper(node.right, depth + 1, node, del_key, pos_x + f/2, pos_y + 10, f/2);

                if(node.right == null) {
                    changeNotesValue("delete ", "notes2");
                    await showActiveNode(node.data + " " + depth);

                    removeNode(node.data + " " + depth);

                    node = node.left;
                    this.reposition(node, depth + 1, null, pos_x, pos_y, f);
                    if(parent != null) addEdge(node.data + " " + depth, parent.data + " " + (depth - 1));

                    // node.data = node.left.data;
                    // node.size = 1;
                    // node.left = await this.deleteHelper(node.left, depth + 1, node, parseInt(node.left.data), pos_x - f/2, pos_y + 10, f/2);
                } else {
                    node.size = 1 + node.left.size + node.right.size;
                }
            }

            changeNodeLabel(node.data + " " + depth, node.data + " (1)");

            return node;
        }
    }

    reposition(node, depth, parent, pos_x, pos_y, f) {
        if(node == null) return;

        console.log("remove ", node.data + " " + depth, pos_x, pos_y);
        removeNode(node.data + " " + depth);
        addNode(node.data + " " + (depth - 1), node.data, pos_x, pos_y, f);

        if(parent != null) addEdge(node.data + " " + (depth - 1), parent.data + " " + (depth - 2));
        // changeNodePosition(node.data, pos_x, pos_y);

        this.reposition(node.left, depth + 1, node, pos_x - f/2, pos_y + 10, f/2);
        this.reposition(node.right, depth + 1, node, pos_x + f/2, pos_y + 10, f/2);
    }

    async find(find_key) {
        return await this.findHelper(this.head, 0, find_key);
    }

    async findHelper(node, depth, find_key) {
        if(node == null) return false;

        if(node.right == null) {
            if(node.data == find_key) {
                changeNotesValue("For leaf mode " + node.data + ", " + find_key + " == " + node.data, "notes2");
                changeNotesValue("node found", "notes3");

                return true;
            } else {
                changeNotesValue("For leaf node " + node.data + ", " + find_key + " != " + node.data, "notes2");
                changeNotesValue("node not found", "notes3");

                return false;
            }
        }

        if(node.data > find_key) {
            changeNotesValue("For Node " + node.data + ", " + find_key + " < " + node.data, "notes2");
            changeNotesValue("go to left subtree", "notes3");
        } else {
            changeNotesValue("For Node " + node.data + ", " + find_key + " >= " + node.data, "notes2");
            changeNotesValue("go to right subtree", "notes3");
        }

        await showActiveNode(node.data + " " + depth);

        if(node.data > find_key) return this.findHelper(node.left, depth + 1, find_key);
        else return this.findHelper(node.right, depth + 1, find_key);
    }
};