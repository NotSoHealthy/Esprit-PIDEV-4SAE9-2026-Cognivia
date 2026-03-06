package com.pidev.pharmacy.services;

import java.util.List;

public interface IService<T> {
    List<T> getAll();
    T getById(Long id);
    T create(T entity);
    T update(Long id, T entity);
    void delete(Long id);
}