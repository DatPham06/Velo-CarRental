package com.velo.service;

import com.velo.entity.ProductEntity;
import com.velo.repository.ProductRepository;

import java.util.List;

public interface ProductService {

    ProductEntity createProduct(ProductEntity productEntity);
    List<ProductEntity> findAllProduct();
    List<ProductEntity> findAllByBrand(String Brand);

}
