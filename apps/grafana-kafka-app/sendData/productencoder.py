#!/usr/bin/env python
# =============================================================================
#
# JSON Product Encoder Module
#
# =============================================================================
from json import JSONEncoder


# Serialize a Product Class to JSON
class ProductEncoder(JSONEncoder):
    def default(self, o):
        """
            Returns a dict representation of a Product instance for serialization.

            Args:
                product (Product): Product instance.

            Returns:
                dict: Dict populated with product attributes to be serialized.

            """
        return dict(productID=o.productID,
                    productDescription=o.productDescription,
                    productSpecs=o.productSpecs)
