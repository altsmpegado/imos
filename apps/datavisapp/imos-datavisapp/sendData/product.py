#!/usr/bin/env python
# =============================================================================
#
# Product Class
#
# =============================================================================

class Product(object):

    """
    Product record

    Args:
        productID (str): Product ID

        productDescription (str): Product description

        productSpecs (int): Product Specifications

    """
    def __init__(self, prodID,prodDesc,prodSpecs):
        self.productID = prodID
        self.productDescription = prodDesc
        self.productSpecs = prodSpecs

    def toDict(self):
        """
        Returns a dict representation of a Product instance for serialization.

        Args:
            product (Product): Product instance.

        Returns:
            dict: Dict populated with product attributes to be serialized.

        """
        return dict(productID=self.productID,
                    productDescription=self.productDescription,
                    productSpecs=self.productSpecs)



