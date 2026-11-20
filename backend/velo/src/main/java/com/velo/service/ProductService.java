package com.velo.service;

import com.velo.entity.ProductEntity;

import java.util.List;

public interface ProductService {

    ProductEntity createProduct(ProductEntity productEntity);
    List<ProductEntity> findAllProduct();
    List<ProductEntity> findVisibleForRental();
    List<ProductEntity> findAllByBrand(String Brand);
    ProductEntity findById(long id);
    ProductEntity updateProduct(long id, ProductEntity product);
    void deleteProduct(long id);

}
