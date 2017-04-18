#include <stdio.h>
#include <stdlib.h>

/*Linked List
Advantages:
	- Easy to insert/append and remove elements
Disadvantages:
	- More overhead required
	- No O(1) access
	- Difficult to debug
*/

typedef struct node
{
	int value;
	struct node* next;
} node;

class linkedlist
{
	//Convert array to linked list
	public:
		node* head;
		void arrayToList(int arr[], int arrlen)
		{
			node* current = NULL;
			node* prev = NULL;
			
			head = new node;
			head->value = arr[0];

			for(int i = 1; i < arrlen; ++i)
			{
				//create new node
				node* new_node = new node;
				//previous node's next is equal to the address to the new node
				if(i == 1)
				{
					head->next = new_node;
				}
				else
				{
					prev->next = new_node;
				}
				//set value of current node
				new_node->value = arr[i];
				prev = new_node;
				new_node->next = NULL;
			}
			printf("\n");
		}

		void arrayToSortedList(int arr[], int arrlen)
		{
			head->value = arr[0];
		
			for(int i = 1; i < arrlen; ++i)
			{
				node* current = head;
				node* prev = NULL;

				node* new_node = new node;
				new_node->value = arr[i];
				while(current != NULL)
				{
					if(new_node->value > current->value)
					{
						new_node->next = prev->next;
						prev->next = new_node;
					}
					prev = current;
					current = current->next;
				}
			}
		}

		void printList()
		{
			node* current = head;
			while(current != NULL)
			{
				printf("%i\n", current->value);
				current = current->next;
			}
		}

		void freeList()
		{
			node* current = head;
			while(current != NULL)
			{
				node* temp = current->next;
				free(current);
				current = temp;
			}
		}

		void insert(node* new_node)
		{
		}

		void remove()
		{
		}
	private:
};

//Sort into binary tree

int main()
{
	int a[10];
	int n = sizeof(a)/sizeof(int);

	for(int i = 0; i < 10; ++i)
	{
		a[i] = rand() % 10;
		printf("%i ", a[i]);
	}
	
	printf("\nLinked List Implementation!\n");
	linkedlist* abc = new linkedlist;
	abc->arrayToList(a, n);
	abc->printList();
	abc->freeList();
	free(abc);

	printf("\nBinary Tree Implementation!\n");

	getchar();
	return 0;
}
